import { insforgeAdmin } from './config/insforge.js';

async function run() {
  console.log("Fetching snippet counts...");
  const { data, error } = await insforgeAdmin.database
    .from('questions')
    .select('topic, id')
    .like('id', 'snip-%');

  if (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }

  const counts: Record<string, number> = {};
  for (const q of data || []) {
    counts[q.topic] = (counts[q.topic] || 0) + 1;
  }
  
  console.log("--- Snippet Counts ---");
  console.table(counts);
  process.exit(0);
}

run();
