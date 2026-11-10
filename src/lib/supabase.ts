import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Optional Supabase client.
 * Only the public anon key is used here – row level security (see
 * supabase/migrations) makes sure players can only touch their own rows.
 * The SDK is loaded lazily so offline players never download it.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isCloudConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(url as string, anonKey as string, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        }),
      )
      .catch((err) => {
        console.warn('[supabase] failed to load', err);
        return null;
      });
  }
  return clientPromise;
}
