import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url =
    import.meta.env.VITE_SUPABASE_URL

  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Supabase realtime for chat will be disabled if env is not configured.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Admin Supabase] Realtime disabled: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or compatible fallbacks).'
      );
    }
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
