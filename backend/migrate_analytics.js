import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const DATABASE_URL = 'postgresql://postgres:%23Manthan31256@db.llerufiektzdfelaovzj.supabase.co:5432/postgres';

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres for Analytics migration!');

    const sqlPath = path.resolve('migrations/05_analytics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration query...');
    await client.query(sql);
    console.log('Finished running 05_analytics.sql migration.');

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reloaded PostgREST schema cache.");
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
