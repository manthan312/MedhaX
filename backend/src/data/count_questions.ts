import { insforgeAdmin } from '../config/insforge.js';

async function countQuestions() {
  const { count, error } = await insforgeAdmin.database
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching count:", error);
  } else {
    console.log(`EXACT TOTAL MCQs IN DB: ${count}`);
  }
  process.exit(0);
}

countQuestions();
