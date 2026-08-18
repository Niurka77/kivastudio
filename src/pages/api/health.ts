import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Endpoint de salud / keep-alive.
 *
 * Lo invoca el cron diario de Vercel (ver `vercel.json`). Consulta Supabase con
 * un query mínimo para generar actividad de API: así el proyecto del plan
 * gratuito no se pausa por inactividad (7 días). Devuelve 200 aunque Supabase
 * esté en restauración/indispuesto, para que el cron nunca marque error.
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  let supabase: 'ok' | 'down' = 'down';
  try {
    const { error } = await getSupabaseServiceClient()
      .from('posts')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    supabase = error ? 'down' : 'ok';
  } catch {
    supabase = 'down';
  }

  return new Response(JSON.stringify({ ok: true, supabase, ts: Date.now() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    },
  });
};
