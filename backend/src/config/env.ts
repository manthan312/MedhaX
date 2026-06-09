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

const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
};

export const JWT_SECRET = cleanEnvVar(process.env.JWT_SECRET) || 'medhax_super_secret_jwt_2024';
export const PORT = parseInt(process.env.PORT ?? '8080', 10);
export const SUPABASE_URL = cleanEnvVar(process.env.SUPABASE_URL) || 'https://llerufiektzdfelaovzj.supabase.co';
export const SUPABASE_ANON_KEY = cleanEnvVar(process.env.SUPABASE_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);
