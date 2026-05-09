// Lazy singleton Supabase client.
// Only initialized when first called (so SSG build doesn't break if env vars
// happen to be missing at build time — though they should be set on Netlify).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key) {
    console.warn('Supabase env vars not configured (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
