import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, requireEnv } from '@/lib/env';

/**
 * Cliente de Supabase para el navegador (islas React / Panel Admin).
 * Utiliza SOLO la anon key, nunca el service role, y opera bajo RLS.
 * Ver 02_PROJECT_ARCHITECTURE.md §15 y ADR A.5 (acceso vía servicios).
 */

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = requireEnv('PUBLIC_SUPABASE_URL', env.supabaseUrl);
  const anonKey = requireEnv('PUBLIC_SUPABASE_ANON_KEY', env.supabaseAnonKey);

  if (!url || !anonKey) {
    // Sin credenciales no se inicializa; el fallo se produce en dev sin romper.
    throw new Error('Supabase no está configurado. Revisa tu archivo .env');
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
