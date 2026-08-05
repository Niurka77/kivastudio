import { type ReactNode, useSyncExternalStore } from 'react';
import {
  getAdminStatus,
  initAdminStatus,
  subscribeAdminStatus,
} from '@/lib/auth/admin-status';

initAdminStatus();

/**
 * Portal de acceso al panel admin.
 * Muestra los children solo si hay una sesión admin (UI). La seguridad real de
 * las escrituras está en el servidor (JWT + ADMIN_EMAILS).
 */
export default function AdminGate({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(
    subscribeAdminStatus,
    getAdminStatus,
    () => 'loading' as const,
  );

  if (status === 'loading') {
    return <p className="py-10 text-center text-muted-foreground">Verificando acceso…</p>;
  }

  if (status === 'denied') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Acceso restringido
        </h2>
        <p className="mt-2 text-muted-foreground">
          Necesitas ser admin (Kaili o Dayna) para entrar al panel.
        </p>
        <a
          href="/admin/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[16px] bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
