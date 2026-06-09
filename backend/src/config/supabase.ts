import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './env.js';
import { WebSocket as WsWebSocket } from 'ws';

// ─── WebSocket Polyfill for Node.js 20 ───────────────────────────────────────
// Node.js 20 does not have native WebSocket support.
// Supabase's realtime client requires it — we polyfill using the `ws` package.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WsWebSocket;
}

// ─── Validate Keys ────────────────────────────────────────────────────────────
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required but not set.');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY is required but not set.');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not set.');
}

console.log('✅ [supabase] Initializing Supabase clients...');
console.log(`   URL: ${SUPABASE_URL}`);

// Anon client — used for auth and user-facing database access
const sbAnon: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin (service role) client — bypasses RLS, used for seeding and admin ops
const sbAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('✅ [supabase] Both anon and admin clients initialized successfully.');

export interface SupabaseClientWrapper {
  database: SupabaseClient;
  auth: any;
}

export const supabase: SupabaseClientWrapper = {
  get database(): SupabaseClient {
    return sbAnon;
  },
  get auth(): any {
    return sbAnon.auth;
  }
};

export const supabaseAdmin: SupabaseClientWrapper = {
  get database(): SupabaseClient {
    return sbAdmin;
  },
  get auth(): any {
    return sbAdmin.auth;
  }
};
