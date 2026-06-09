import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search paths for .env and .env.local
const searchDirs = [
  process.cwd(),
  path.resolve(process.cwd(), 'backend'),
  path.resolve(__dirname, '../..'),
];

for (const dir of searchDirs) {
  dotenv.config({ path: path.join(dir, '.env.local') });
  dotenv.config({ path: path.join(dir, '.env') });
}

export const JWT_SECRET = process.env.JWT_SECRET || 'medhax_super_secret_jwt_2024';
export const PORT = parseInt(process.env.PORT ?? '8080', 10);
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.INSFORGE_URL || 'https://crejs4dr.us-east.insforge.app';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.INSFORGE_ANON_KEY || process.env.ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.INSFORGE_SERVICE_KEY || process.env.API_KEY || '';
