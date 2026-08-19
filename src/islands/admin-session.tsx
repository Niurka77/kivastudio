import { useState, useSyncExternalStore } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import {
  getAdminIdentity,
  subscribeAdminStatus,
  ROLE_LABEL,
} from '@/lib/auth/admin-status';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/browser-auth';

/**
 * Cabecera de sesión admin: muestra quién está conectado (nombre, email y rol)
 * junto al botón de cerrar sesión. Personaliza UX según sea Kaili (Dueña) o
 * Dayna (Editora).
 */
export default function AdminSession() {
  const [loading, setLoading] = useState(false);
  const identity = useSyncExternalStore(
    subscribeAdminStatus,
    getAdminIdentity,
    () => null,
  );

  const handleClick = async () => {
    setLoading(true);
    await signOut();
    window.location.assign('/');
  };

  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-secondary/50 p-3">
      {identity && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {identity.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {identity.email} · {ROLE_LABEL[identity.role]}
          </p>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="size-4" aria-hidden="true" />
        )}
        {identity ? 'Cerrar sesión' : 'Sesión'}
      </Button>
    </div>
  );
}