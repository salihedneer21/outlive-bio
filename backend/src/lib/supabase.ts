import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@config/env';

let supabaseAnonClient: SupabaseClient | null = null;
let supabaseServiceClient: SupabaseClient | null = null;

/**
 * Public Supabase client
 *
 * Uses the anon key and is suitable for auth flows and
 * operations that respect Row Level Security.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseAnonClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase anon environment variables are not set');
    }

    supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  return supabaseAnonClient;
};

/**
 * Service-role Supabase client
 *
 * Uses the service role key and is intended only for trusted
 * backend operations (never expose this key to clients).
 */
export const getSupabaseServiceClient = (): SupabaseClient => {
  if (!supabaseServiceClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase service role environment variables are not set');
    }

    supabaseServiceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return supabaseServiceClient;
};
