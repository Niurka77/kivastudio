import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/browser-auth';

/** Cierra la sesión del admin y vuelve a la tienda. */
export default function AdminSignOut() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await signOut();
    window.location.assign('/');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={loading}
    >
      <LogOut className="size-4" aria-hidden="true" /> Cerrar sesión
    </Button>
  );
}
