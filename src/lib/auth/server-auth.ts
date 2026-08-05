import type { User } from '@supabase/supabase-js';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Autenticación/autorización de SERVIDOR (Server Endpoints del admin).
 *
 * Las rutas de escritura verifican el JWT del usuario con el service role
 * (`getUser`) y comprueban que su email esté en el allowlist ADMIN_EMAILS.
 * Así, aunque alguien conozca la API, solo un admin autenticado escribe.
 * Ver 02_PROJECT_ARCHITECTURE.md §15 y ADR B.5.
 *
 * Roles: la PRIMERA dirección en ADMIN_EMAILS es la dueña (owner), el resto
 * son editoras (editor). Ver .env.example.
 */

export type AdminRole = 'owner' | 'editor';

export interface AdminContext {
  user: User;
  role: AdminRole;
}

export function getAdminEmails(): string[] {
  const raw = import.meta.env.ADMIN_EMAILS as string | undefined;
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Rol de un admin según su email (dueña = primera dirección configurada). */
export function getAdminRole(email: string): AdminRole {
  const list = getAdminEmails();
  return list[0] === email.toLowerCase() ? 'owner' : 'editor';
}

/** Devuelve el contexto admin si el request trae un JWT válido de un admin. */
export async function getAdminUser(request: Request): Promise<AdminContext | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const email = data.user.email?.toLowerCase();
  if (!email || !getAdminEmails().includes(email)) return null;

  return { user: data.user, role: getAdminRole(email) };
}

function bearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
