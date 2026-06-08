import { insforgeAdmin } from './config/insforge.js';

async function run() {
  console.log("Fetching snippet counts...");
  const counts: Record<string, number> = {};
  let offset = 0;
  const limit = 1000;
  
  while (true) {
      const { data, error } = await insforgeAdmin.database
        .from('questions')
        .select('topic')
        .like('id', 'snip-%')
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("DB Error:", error);
        process.exit(1);
      }
      
      if (!data || data.length === 0) break;

      for (const q of data) {
        counts[q.topic] = (counts[q.topic] || 0) + 1;
      }
      
      if (data.length < limit) break;
      offset += limit;
  }
  
  console.log("--- Snippet Counts ---");
  console.table(counts);
  process.exit(0);
}

run();
