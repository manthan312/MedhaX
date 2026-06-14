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
    console.log('Connected to Supabase Postgres!');

    const migrationsDir = path.resolve('migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file === '04_grants.sql') {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        console.log(`Finished migration: ${file}`);
      }
    }
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reloaded PostgREST schema cache.");
    
    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
