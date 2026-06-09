import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const GEMINI_KEYS_RAW = process.env.GEMINI_API_KEYS ?? process.env.GEMINI_API_KEY ?? '';

const geminiKeys = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let currentKeyIndex = 0;
function getNextGeminiAI() {
  const key = geminiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;
  return new GoogleGenerativeAI(key);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const TARGET_TOPICS = [
  { language: 'C++', topic: 'CPP-OOP-fundamentals' },
  { language: 'C++', topic: 'CPP-templates' },
  { language: 'DSA', topic: 'DSA-Pattern-prefix-sum' },
  { language: 'DSA', topic: 'DSA-Pattern-sliding-window' },
  { language: 'Java', topic: 'Java-OOP-concepts' },
  { language: 'Java', topic: 'Java-arrays' },
  { language: 'JavaScript', topic: 'JS-arrays' },
  { language: 'JavaScript', topic: 'JS-closures' },
  { language: 'JavaScript', topic: 'JS-strings' },
  { language: 'Python', topic: 'Python-OOP-concepts' },
  { language: 'Python', topic: 'Python-lists' },
  { language: 'Python', topic: 'Python-strings' }
];

const DIFFICULTY_DISTRIBUTION = [
  { difficulty: 'medium', count: 24 },
  { difficulty: 'hard', count: 24 },
  { difficulty: 'extra-hard', count: 24 }
];

async function generateMCQBatch(combo: { language: string, topic: string }, difficulty: string, count: number): Promise<any[]> {
    const ai = getNextGeminiAI();
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash', generationConfig: { responseMimeType: 'application/json' }});

    const prompt = `
You are an expert ${combo.language} developer and senior software engineer creating rigorous technical interview and certification questions.
Generate exactly ${count} completely unique multiple-choice questions (MCQs) for the topic: "${combo.topic}" at "${difficulty}" difficulty.

REQUIREMENTS:
1. High Technical Depth: Do NOT generate generic or trivial questions. Ask highly specific questions about internals, tricky edge-cases, memory usage, complex interactions, or advanced concepts.
2. Distinct and Non-Repetitive: Make absolutely sure NO TWO QUESTIONS ask the same thing. Each question must tackle a completely different sub-concept of ${combo.topic}.
3. 4 Answer Choices: Provide exactly 4 choices. The distractors (wrong answers) must be highly plausible.
4. Correct Index: Provide the 0-based index (0, 1, 2, or 3).
5. Explanation: Provide a 1-sentence technical explanation.

Return ONLY a JSON array of objects with the exact schema:
[
  {
    "prompt": "The highly technical question text...",
    "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correct_index": 2,
    "explanation": "Brief technical reason."
  }
]
`;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const raw = text.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(raw).slice(0, count);
    } catch (e: any) {
        console.error(`  ⚠️  API Error (${combo.topic} - ${difficulty}):`, e.message);
        return [];
    }
}

async function runSeeder() {
  console.log(`🚀 Starting TARGETED Seeding for ${TARGET_TOPICS.length} specific topics...`);

  let totalInserted = 0;
  for (const combo of TARGET_TOPICS) {
      console.log(`\n⏳ Pumping extra questions for: ${combo.language} / ${combo.topic}`);
      const comboRows: any[] = [];
      let seqNum = 1;

      for (const { difficulty, count } of DIFFICULTY_DISTRIBUTION) {
          const batchSize = 12;
          for (let i = 0; i < count; i += batchSize) {
              const reqCount = Math.min(batchSize, count - i);
              let generated = await generateMCQBatch(combo, difficulty, reqCount);
              
              let retries = 0;
              while (generated.length < reqCount && retries < 5) {
                  await sleep(2000);
                  const missing = reqCount - generated.length;
                  const extra = await generateMCQBatch(combo, difficulty, missing);
                  generated = generated.concat(extra);
                  retries++;
              }

              for (const item of generated) {
                  const id = `targeted-${slugify(combo.language)}-${slugify(combo.topic)}-${slugify(difficulty)}-${Date.now()}-${seqNum}`;
                  comboRows.push({
                      id,
                      language: combo.language,
                      topic: combo.topic,
                      difficulty,
                      prompt: item.prompt,
                      choices: item.choices,
                      correct_index: item.correct_index,
                      explanation: item.explanation || ''
                  });
                  seqNum++;
              }
              await sleep(100);
          }
      }

      if (comboRows.length > 0) {
          const CHUNK = 10;
          for (let i = 0; i < comboRows.length; i += CHUNK) {
            const batch = comboRows.slice(i, i + CHUNK);
            const { error } = await db.from('questions').insert(batch);
            if (error) {
              console.error(`\n  ❌ Chunk error:`, error.message);
            } else {
              totalInserted += batch.length;
            }
          }
          console.log(`  ✅ Successfully boosted ${combo.topic} with ${comboRows.length} NEW questions!`);
      }
  }

  console.log(`\n🎉 TARGETED SEEDING COMPLETE! Inserted exactly ${totalInserted} extra high-level questions into the requested topics.`);
  process.exit(0);
}

runSeeder();
