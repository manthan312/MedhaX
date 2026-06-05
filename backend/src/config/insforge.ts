import { createClient, createAdminClient } from '@insforge/sdk';
import { INSFORGE_URL, INSFORGE_ANON_KEY, INSFORGE_SERVICE_KEY } from './env.js';

export const insforge = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY });
export const insforgeAdmin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_SERVICE_KEY });
