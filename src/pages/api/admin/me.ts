import type { APIRoute } from 'astro';
import { getAdminUser } from '@/lib/auth/server-auth';

/**
 * Devuelve la identidad (email, nombre y rol) del admin autenticado.
 * El navegador no puede leer `admin_roles` por RLS; este endpoint le entrega
 * el rol vía un request autenticado con su JWT (ver admin-status.ts).
 */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return new Response(JSON.stringify({ message: 'No autorizado' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const meta = admin.user.user_metadata as { full_name?: string } | undefined;
  return new Response(
    JSON.stringify({
      email: admin.user.email,
      role: admin.role,
      name: meta?.full_name ?? admin.user.email?.split('@')[0] ?? '',
    }),
    { status: 200, headers: JSON_HEADERS },
  );
};