import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INSFORGE_URL, INSFORGE_ANON_KEY, INSFORGE_SERVICE_KEY } from './env.js';

const sbAnon = createClient(INSFORGE_URL, INSFORGE_ANON_KEY);
const sbAdmin = createClient(INSFORGE_URL, INSFORGE_SERVICE_KEY);

export interface InsforgeClient {
  database: SupabaseClient;
  auth: any;
}

export const insforge: InsforgeClient = {
  database: sbAnon,
  auth: sbAnon.auth
};

export const insforgeAdmin: InsforgeClient = {
  database: sbAdmin,
  auth: sbAdmin.auth
};

