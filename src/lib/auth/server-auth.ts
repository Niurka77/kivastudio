import { getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Autenticación/autorización de SERVIDOR (Server Endpoints del admin).
 *
 * Las rutas de escritura verifican el JWT del usuario con el service role
 * (`getUser`) y comprueban que su email esté en el allowlist ADMIN_EMAILS.
 * Así, aunque alguien conozca la API, solo un admin autenticado escribe.
 * Ver 02_PROJECT_ARCHITECTURE.md §15 y ADR B.5.
 */

export function getAdminEmails(): string[] {
  const raw = import.meta.env.ADMIN_EMAILS as string | undefined;
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Devuelve el usuario admin si el request trae un JWT válido de un admin. */
export async function getAdminUser(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const email = data.user.email?.toLowerCase();
  if (!email || !getAdminEmails().includes(email)) return null;

  return data.user;
}

function bearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
