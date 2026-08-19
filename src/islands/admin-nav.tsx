import { initAdminStatus, useAdminRole } from '@/lib/auth/admin-status';

initAdminStatus();

/**
 * Navegación lateral del panel admin. Muestra los enlaces según el rol de la
 * hermana conectada:
 * - Todas: Panel, Pedidos, Reseñas.
 * - Dueña: además Videos, Secciones, Novedades y Nuevo producto.
 * - Tendencias: Novedades.
 * - Videos: Videos.
 * - Productos: Nuevo producto.
 * - Editora (fallback): Videos, Novedades y Nuevo producto.
 */
export default function AdminNav({ active }: { active?: string }) {
  const role = useAdminRole();
  const owner = role === 'owner';
  const canVideos = role === 'owner' || role === 'videos' || role === 'editor';
  const canPosts = role === 'owner' || role === 'trends' || role === 'editor';
  const canProducts = role === 'owner' || role === 'products' || role === 'editor';
  const canSections = role === 'owner';

  const baseLinks = [
    { href: '/admin', id: 'dashboard', label: 'Panel' },
    { href: '/admin/pedidos', id: 'orders', label: 'Pedidos' },
    { href: '/admin/resenas', id: 'reviews', label: 'Reseñas' },
  ] as const;

  const roleLinks = [
    ...(canVideos ? [{ href: '/admin/videos', id: 'videos', label: 'Videos' }] : []),
    ...(canSections
      ? [{ href: '/admin/secciones', id: 'sections', label: 'Secciones' }]
      : []),
    ...(canPosts ? [{ href: '/admin/novedades', id: 'posts', label: 'Novedades' }] : []),
    ...(canProducts
      ? [{ href: '/admin/nuevo', id: 'new', label: 'Nuevo producto' }]
      : []),
  ] as const;

  const links = role ? [...baseLinks, ...roleLinks] : baseLinks;

  return (
    <nav className="mt-2 flex items-center gap-1 overflow-x-auto px-5 pb-3 lg:mt-8 lg:flex-col lg:items-stretch lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
      {links.map((l) => (
        <a
          key={l.id}
          href={l.href}
          className={[
            'whitespace-nowrap rounded-[12px] px-3 py-2 text-sm font-semibold transition-colors',
            active === l.id
              ? 'bg-primary/10 text-primary-strong'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          ].join(' ')}
        >
          {l.label}
        </a>
      ))}
      {owner && (
        <span className="whitespace-nowrap rounded-[12px] px-3 py-2 text-xs font-medium text-primary-strong/70">
          Dueña
        </span>
      )}
      <a
        href="/"
        className="whitespace-nowrap rounded-[12px] px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        Ver tienda
      </a>
    </nav>
  );
}