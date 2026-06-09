import { supabaseAdmin } from '../config/supabase.js';

async function countQuestions() {
  const response = await supabaseAdmin.database
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log("Response:", response);

  if (response.error) {
    console.error("Error fetching count:", response.error);
  } else {
    console.log(`EXACT TOTAL MCQs IN DB: ${response.count}`);
  }
  process.exit(0);
}

countQuestions();
