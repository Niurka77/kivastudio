import type { User } from '@supabase/supabase-js';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Autenticación/autorización de SERVIDOR (Server Endpoints del admin).
 *
 * Las rutas de escritura verifican el JWT del usuario con el service role
 * (`getUser`) y comprueban que su email esté en el allowlist ADMIN_EMAILS.
 * Así, aunque alguien conozca la API, solo un admin autenticado escribe.
 *
 * Roles (tabla `admin_roles`, ver migración 0005):
 * - owner    -> la dueña: puede todo (Kaili).
 * - trends   -> novedades / día a día (Dayna).
 * - videos   -> videos de las creaciones.
 * - products -> productos.
 * - editor   -> fallback para admins sin fila en admin_roles (acceso a novedades).
 * La dueña por defecto es la PRIMERA dirección en ADMIN_EMAILS.
 */

export type AdminRole = 'owner' | 'trends' | 'videos' | 'products' | 'editor';

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

/** Rol de un admin según su fila en `admin_roles` (con fallback). */
export async function getAdminRole(email: string): Promise<AdminRole> {
  const normalized = email.toLowerCase();
  const { data } = await getSupabaseServiceClient()
    .from('admin_roles')
    .select('role')
    .eq('email', normalized)
    .maybeSingle();

  if (data?.role === 'owner' || data?.role === 'trends' || data?.role === 'videos' || data?.role === 'products') {
    return data.role;
  }

  // Fallback: la primera dirección configurada es la dueña; el resto editora.
  const list = getAdminEmails();
  return list[0] === normalized ? 'owner' : 'editor';
}

/**
 * Comprueba si el admin puede operar sobre un área. La dueña (owner) siempre
 * puede; el resto debe tener el rol indicado. `editor` equivale a `trends`.
 */
export function adminCan(
  admin: AdminContext | null,
  ...roles: AdminRole[]
): boolean {
  if (!admin) return false;
  if (admin.role === 'owner') return true;
  if (admin.role === 'editor' && roles.includes('trends')) return true;
  return roles.includes(admin.role);
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

  return { user: data.user, role: await getAdminRole(email) };
}

function bearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}