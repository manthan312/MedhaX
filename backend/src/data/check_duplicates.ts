import { createAdminClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const INSFORGE_URL        = process.env.INSFORGE_URL        ?? '';
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY ?? '';

async function main() {
  if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY) {
    console.error('Missing INSFORGE env keys');
    return;
  }

  const db = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_SERVICE_KEY });

  console.log('Fetching questions from DB...');
  const allQs: any[] = [];
  let offset = 0;
  const LIMIT = 1000;

  while (true) {
    const { data, error } = await db.database
      .from('questions')
      .select('id, prompt, language, topic, difficulty')
      .range(offset, offset + LIMIT - 1);

    if (error) {
      console.error('Error fetching questions:', error.message);
      return;
    }
    if (!data || data.length === 0) break;
    allQs.push(...data);
    if (data.length < LIMIT) break;
    offset += LIMIT;
  }

  console.log(`Fetched ${allQs.length} questions.`);

  const promptCounts = new Map<string, any[]>();
  for (const q of allQs) {
    // Normalise prompt by stripping the trailing signature, lowercase, and spaces
    let cleanPrompt = q.prompt.replace(/\(subtopic:.*?, v:\s*\d+\)/g, '').trim();
    cleanPrompt = cleanPrompt.replace(/\[dup:\s*\d+\]/g, '').trim();
    cleanPrompt = cleanPrompt.replace(/\s+/g, ' ').toLowerCase();

    if (!promptCounts.has(cleanPrompt)) {
      promptCounts.set(cleanPrompt, []);
    }
    promptCounts.get(cleanPrompt)!.push(q);
  }

  let duplicateGroups = 0;
  let totalDuplicateRows = 0;

  for (const [prompt, list] of promptCounts.entries()) {
    if (list.length > 1) {
      duplicateGroups++;
      totalDuplicateRows += (list.length - 1);
      if (duplicateGroups <= 10) {
        console.log(`\nDuplicate Group: "${prompt.slice(0, 100)}..."`);
        console.log(`Found ${list.length} occurrences:`);
        for (const item of list) {
          console.log(` - ID: ${item.id} | Lang: ${item.language} | Topic: ${item.topic}`);
        }
      }
    }
  }

  console.log(`\nDuplicate Groups: ${duplicateGroups}`);
  console.log(`Total duplicate rows that can be removed: ${totalDuplicateRows}`);
}

main().catch(console.error);
