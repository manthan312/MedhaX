import { supabaseAdmin } from '../config/supabase.js';

async function cleanUpAndCount() {
  console.log("Cleaning up easy questions...");
  const { error: err1 } = await supabaseAdmin.database
    .from('questions')
    .delete()
    .eq('difficulty', 'easy');
  if (err1) console.error("Error deleting easy:", err1.message);
  else console.log("Deleted easy questions.");

  console.log("Cleaning up dummy snippets...");
  const { error: err2 } = await supabaseAdmin.database
    .from('questions')
    .delete()
    .like('id', 'snip-%');
  if (err2) console.error("Error deleting snippets:", err2.message);
  else console.log("Deleted dummy snippet questions.");

  console.log("Fetching counts...");
  const { data: mcqs, error: err3 } = await supabaseAdmin.database
    .from('questions')
    .select('id')
    .not('id', 'like', 'snip-%');
  if (err3) console.error("Error counting MCQs:", err3.message);
  
  const { data: snippets, error: err4 } = await supabaseAdmin.database
    .from('questions')
    .select('id')
    .like('id', 'snip-%');
  if (err4) console.error("Error counting snippets:", err4.message);

  console.log(`\n=== DATABASE COUNTS ===`);
  console.log(`Remaining MCQs: ${mcqs?.length || 0}`);
  console.log(`Remaining Snippets: ${snippets?.length || 0}`);
  console.log(`=======================\n`);
}

cleanUpAndCount();
