import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './env.js';

let sbAnon: SupabaseClient | null = null;
let sbAdmin: SupabaseClient | null = null;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (SUPABASE_URL && isValidUrl(SUPABASE_URL)) {
  try {
    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'placeholder-key');
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('⚠️ SUPABASE_URL is not set or invalid. Supabase client is not initialized.');
}

export interface SupabaseClientWrapper {
  database: SupabaseClient;
  auth: any;
}

export const supabase: SupabaseClientWrapper = {
  get database(): SupabaseClient {
    if (!sbAnon) {
      throw new Error("Supabase client is not initialized. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.");
    }
    return sbAnon;
  },
  get auth(): any {
    if (!sbAnon) {
      throw new Error("Supabase client is not initialized. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.");
    }
    return sbAnon.auth;
  }
};

export const supabaseAdmin: SupabaseClientWrapper = {
  get database(): SupabaseClient {
    if (!sbAdmin) {
      throw new Error("Supabase Admin client is not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
    }
    return sbAdmin;
  },
  get auth(): any {
    if (!sbAdmin) {
      throw new Error("Supabase Admin client is not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
    }
    return sbAdmin.auth;
  }
};
