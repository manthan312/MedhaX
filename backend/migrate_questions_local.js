import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import pkg from 'pg';
const { Client } = pkg;

const gzFilePath = 'C:\\Users\\Manthan\\Downloads\\20260608_170101.sql.gz';
const DATABASE_URL = 'postgresql://postgres:%23Manthan31256@db.llerufiektzdfelaovzj.supabase.co:5432/postgres';

function unescapePgCopy(val) {
  if (val === '\\N' || val === undefined) return null;
  let res = '';
  for (let i = 0; i < val.length; i++) {
    if (val[i] === '\\') {
      i++;
      if (i >= val.length) {
        res += '\\';
        break;
      }
      const c = val[i];
      if (c === 'n') res += '\n';
      else if (c === 't') res += '\t';
      else if (c === 'r') res += '\r';
      else if (c === 'b') res += '\b';
      else if (c === 'f') res += '\f';
      else res += c;
    } else {
      res += val[i];
    }
  }
  return res;
}

async function migrate() {
  console.log('═'.repeat(60));
  console.log('  MedhaX — Full Local Question Migration: SQL Dump → Supabase');
  console.log('═'.repeat(60));

  // 1. Read and parse SQL Dump
  console.log(`📦 Decompressing and reading SQL dump from: ${gzFilePath}`);
  const fileStream = fs.createReadStream(gzFilePath);
  const unzipStream = zlib.createGunzip();
  const rl = readline.createInterface({
    input: fileStream.pipe(unzipStream),
    crlfDelay: Infinity
  });

  let inQuestionsCopy = false;
  const questions = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (line.startsWith('COPY public.questions ')) {
      inQuestionsCopy = true;
      console.log(`[Line ${lineNum}] Found COPY public.questions statement. Starting parse...`);
      continue;
    }

    if (inQuestionsCopy) {
      if (line === '\\.') {
        console.log(`[Line ${lineNum}] Found end of COPY block (\\.).`);
        break;
      }

      const parts = line.split('\t');
      if (parts.length < 8) {
        console.warn(`[Line ${lineNum}] Warning: line has fewer than 8 columns: ${line.substring(0, 100)}`);
        continue;
      }

      // Column ordering in COPY public.questions:
      // id, language, topic, difficulty, prompt, choices, correct_index, explanation, created_at
      const id = unescapePgCopy(parts[0]);
      const language = unescapePgCopy(parts[1]);
      const topic = unescapePgCopy(parts[2]);
      const difficulty = unescapePgCopy(parts[3]);
      const prompt = unescapePgCopy(parts[4]);
      const choicesStr = unescapePgCopy(parts[5]);
      const correctIndexStr = unescapePgCopy(parts[6]);
      const explanation = unescapePgCopy(parts[7]);
      const createdAt = parts[8] ? unescapePgCopy(parts[8]) : new Date().toISOString();

      let choices;
      try {
        choices = JSON.parse(choicesStr);
      } catch (err) {
        console.error(`❌ JSON parse error for choices at line ${lineNum}:`, choicesStr);
        console.error(err);
        process.exit(1);
      }

      const correct_index = parseInt(correctIndexStr, 10);
      if (isNaN(correct_index)) {
        console.error(`❌ Invalid correct_index at line ${lineNum}:`, correctIndexStr);
        process.exit(1);
      }

      questions.push({
        id,
        language,
        topic,
        difficulty,
        prompt,
        choices: JSON.stringify(choices), // Insert as string for pg jsonb client, or let pg driver stringify
        correct_index,
        explanation,
        created_at: createdAt
      });
    }
  }

  console.log(`✅ Finished parsing SQL dump. Total questions found: ${questions.length}`);

  if (questions.length === 0) {
    console.error('❌ No questions parsed! Aborting.');
    process.exit(1);
  }

  // Show breakdown
  const byLanguage = {};
  for (const q of questions) {
    byLanguage[q.language] = (byLanguage[q.language] || 0) + 1;
  }
  console.log('\n📊 Breakdown by programming language:');
  for (const [lang, count] of Object.entries(byLanguage)) {
    console.log(`   - ${lang}: ${count}`);
  }

  // 2. Connect to Supabase DB and insert
  console.log(`\n🔌 Connecting to Supabase database...`);
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // Clear existing questions
    console.log('🧹 Clearing existing rows in public.questions...');
    await client.query('TRUNCATE TABLE public.questions CASCADE');
    console.log('✅ Cleared public.questions.');

    // Insert in batches
    const batchSize = 200;
    console.log(`📤 Inserting questions in batches of ${batchSize}...`);

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      // Construct multi-row parameterized query
      // INSERT INTO public.questions (id, language, topic, difficulty, prompt, choices, correct_index, explanation, created_at) VALUES ($1, $2, ...), ($10, $11, ...)
      const valuePlaceholders = [];
      const queryValues = [];
      
      for (let j = 0; j < batch.length; j++) {
        const q = batch[j];
        const offset = j * 9;
        valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);
        queryValues.push(
          q.id,
          q.language,
          q.topic,
          q.difficulty,
          q.prompt,
          q.choices,
          q.correct_index,
          q.explanation,
          q.created_at
        );
      }

      const queryText = `
        INSERT INTO public.questions (
          id, language, topic, difficulty, prompt, choices, correct_index, explanation, created_at
        ) VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          language = EXCLUDED.language,
          topic = EXCLUDED.topic,
          difficulty = EXCLUDED.difficulty,
          prompt = EXCLUDED.prompt,
          choices = EXCLUDED.choices,
          correct_index = EXCLUDED.correct_index,
          explanation = EXCLUDED.explanation,
          created_at = EXCLUDED.created_at
      `;

      await client.query(queryText, queryValues);

      if ((i + batchSize) % 1000 === 0 || i + batch.length >= questions.length) {
        console.log(`   📊 Processed ${Math.min(i + batch.length, questions.length)} / ${questions.length} questions.`);
      }
    }

    console.log('\n🎉 Migration complete!');

    // Verify row count
    const res = await client.query('SELECT COUNT(*) FROM public.questions');
    console.log(`🔍 Verification: Row count in public.questions is ${res.rows[0].count}`);

  } catch (err) {
    console.error('❌ Error during database operations:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

migrate().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
