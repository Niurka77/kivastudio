import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

/**
 * Estado reactivo de acceso admin (NAVEGADOR).
 *
 * Usa `useSyncExternalStore` para que las islas re-rendericen sin discrepancias
 * de hidratación y sin llamar a setState en efectos (evita lint RHF/react-hooks).
 * La autorización REAL de escritura ocurre en el servidor (JWT + ADMIN_EMAILS);
 * esto solo muestra/oculta la UI del panel.
 */

const ADMIN_EMAILS = env.adminEmails
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export type AdminStatus = 'loading' | 'ok' | 'denied';

let status: AdminStatus = 'loading';
const listeners = new Set<() => void>();
let initialized = false;

function setStatus(next: AdminStatus) {
  if (status === next) return;
  status = next;
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

function applyEmail(email: string | null | undefined) {
  setStatus(email && ADMIN_EMAILS.includes(email?.toLowerCase()) ? 'ok' : 'denied');
}

/** Inicializa (una vez) la sesión y escucha cambios de auth. Guarda para SSR. */
export function initAdminStatus() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const supabase = getSupabaseBrowserClient();
  void supabase.auth
    .getSession()
    .then(({ data }) => applyEmail(data.session?.user?.email))
    .catch(() => applyEmail(null));
  supabase.auth.onAuthStateChange((_event, session) => applyEmail(session?.user?.email));
}
