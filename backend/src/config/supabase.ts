import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './env.js';

const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface SupabaseClientWrapper {
  database: SupabaseClient;
  auth: any;
}

export const supabase: SupabaseClientWrapper = {
  database: sbAnon,
  auth: sbAnon.auth
};

export const supabaseAdmin: SupabaseClientWrapper = {
  database: sbAdmin,
  auth: sbAdmin.auth
};
