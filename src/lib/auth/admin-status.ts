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
 * rol owner); esto solo muestra/oculta la UI del panel.
 *
 * Identidad: además del estado ok/denied, expone quién entró (email, nombre y
 * rol). La primera dirección de PUBLIC_ADMIN_EMAILS es la dueña (owner).
 */

const ADMIN_EMAILS = env.adminEmails
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export type AdminStatus = 'loading' | 'ok' | 'denied';
export type AdminRole = 'owner' | 'editor';

export interface AdminIdentity {
  email: string;
  name: string;
  role: AdminRole;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Dueña',
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

function applyEmail(session: Session | null) {
  const email = session?.user?.email?.toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) {
    const meta = session?.user?.user_metadata as { full_name?: string } | undefined;
    const name = meta?.full_name ?? deriveName(email);
    status = 'ok';
    identity = { email, name, role: getClientRole(email) };
  } else {
    status = 'denied';
    identity = null;
  }
  emit();
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