import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'medhax_super_secret_jwt_2024';
export const PORT = parseInt(process.env.PORT ?? '8080', 10);
export const INSFORGE_URL = process.env.INSFORGE_URL || 'https://crejs4dr.us-east.insforge.app';
export const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || process.env.ANON_KEY || '';
export const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY || process.env.API_KEY || '';
