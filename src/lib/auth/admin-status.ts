import { useSyncExternalStore } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { Session } from '@supabase/supabase-js';

/**
 * Estado reactivo de acceso admin (NAVEGADOR).
 *
 * Usa `useSyncExternalStore` para que las islas re-rendericen sin discrepancias
 * de hidratación y sin llamar a setState en efectos (evita lint RHF/react-hooks).
 * La autorización REAL de escritura ocurre en el servidor (JWT + ADMIN_EMAILS +
 * rol en admin_roles); esto solo muestra/oculta la UI del panel.
 *
 * El rol fino se obtiene del endpoint autenticado `/api/admin/me` (el navegador
 * no puede leer `admin_roles` por RLS). Mientras llega, se usa un fallback
 * (primera dirección de PUBLIC_ADMIN_EMAILS = dueña).
 */

const ADMIN_EMAILS = env.adminEmails
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export type AdminStatus = 'loading' | 'ok' | 'denied';
export type AdminRole = 'owner' | 'trends' | 'videos' | 'products' | 'editor';

export interface AdminIdentity {
  email: string;
  name: string;
  role: AdminRole;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Dueña',
  trends: 'Tendencias',
  videos: 'Videos',
  products: 'Productos',
  editor: 'Editora',
};

let status: AdminStatus = 'loading';
let identity: AdminIdentity | null = null;
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeAdminStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAdminStatus(): AdminStatus {
  return status;
}

export function getAdminIdentity(): AdminIdentity | null {
  return identity;
}

function getClientRole(email: string): AdminRole {
  return ADMIN_EMAILS[0] === email ? 'owner' : 'editor';
}

function deriveName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function fetchRole(): Promise<AdminRole | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  try {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { role?: AdminRole };
    return body.role ?? null;
  } catch {
    return null;
  }
}

function applyEmail(session: Session | null) {
  const email = session?.user?.email?.toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) {
    const meta = session?.user?.user_metadata as { full_name?: string } | undefined;
    const name = meta?.full_name ?? deriveName(email);
    status = 'ok';
    identity = { email, name, role: getClientRole(email) };
    emit();
    // Rol fino (admin_roles) de forma asíncrona; no bloquea el acceso.
    void fetchRole().then((role) => {
      if (role && identity?.email === email) {
        identity = { ...identity, role };
        emit();
      }
    });
  } else {
    status = 'denied';
    identity = null;
    emit();
  }
}

/** Inicializa (una vez) la sesión y escucha cambios de auth. Guarda para SSR. */
export function initAdminStatus() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const supabase = getSupabaseBrowserClient();
  void supabase.auth
    .getSession()
    .then(({ data }) => applyEmail(data.session))
    .catch(() => applyEmail(null));
  supabase.auth.onAuthStateChange((_event, session) => applyEmail(session));
}

/** Rol del admin conectado (owner = puede eliminar productos). */
export function useAdminRole(): AdminRole | null {
  return useSyncExternalStore(
    subscribeAdminStatus,
    () => identity?.role ?? null,
    () => null,
  );
}