import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Fetching all questions...");
  let allData: any[] = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await db
      .from('questions')
      .select('language, topic')
      .range(start, start + limit - 1);

    if (error) {
      console.error("Error fetching:", error);
      process.exit(1);
    }
    
    if (data.length === 0) break;
    allData = allData.concat(data);
    start += limit;
  }

  const counts: Record<string, Record<string, number>> = {};
  for (const row of allData) {
    if (!counts[row.language]) counts[row.language] = {};
    if (!counts[row.language][row.topic]) counts[row.language][row.topic] = 0;
    counts[row.language][row.topic]++;
  }

  let md = "# Question Distribution Report\n\n";
  
  for (const lang of Object.keys(counts).sort()) {
    md += `## ${lang}\n\n`;
    md += `| Subtopic | Question Count |\n`;
    md += `|---|---|\n`;
    
    let totalLang = 0;
    for (const topic of Object.keys(counts[lang]).sort()) {
      md += `| ${topic} | ${counts[lang][topic]} |\n`;
      totalLang += counts[lang][topic];
    }
    md += `| **TOTAL** | **${totalLang}** |\n\n`;
  }

  fs.writeFileSync(resolve(__dirname, '../../distribution.md'), md);
  console.log("Wrote distribution.md");
}

run();
