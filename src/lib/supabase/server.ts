import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Cliente de Supabase para el SERVIDOR (Server Endpoints del panel admin).
 * Usa el service role key, que SALTA RLS y puede escribir productos.
 * ⚠️ NUNCA importar desde código de cliente (islas React / páginas): la clave
 * de servicio no debe exponerse al navegador (ADR B.5 / 02 §15.10).
 */

let serverClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!env.supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase no está configurado para el servidor. Revisa .env');
  }

  serverClient = createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return serverClient;
}
