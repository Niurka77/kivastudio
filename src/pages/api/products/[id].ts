import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';

/** Elimina un producto (solo admin autenticado). */
export const prerender = false;

export const DELETE: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return new Response(JSON.stringify({ message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ message: 'Falta el id del producto' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await getSupabaseServiceClient()
    .from('products')
    .delete()
    .eq('id', id);
  if (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
