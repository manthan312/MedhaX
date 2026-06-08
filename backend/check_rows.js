import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgresql://postgres:%23Manthan31256@db.llerufiektzdfelaovzj.supabase.co:5432/postgres';

async function check() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT COUNT(*) FROM public.questions');
    console.log(`Row count in questions table: ${res.rows[0].count}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

check();
