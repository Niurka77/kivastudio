import { useMemo } from 'react';
import { Boxes, Loader2, PackageOpen, Search, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import AdminProductsList from '@/islands/admin-products-list';
import { fetchProducts } from '@/lib/api/products';
import { fetchOrders } from '@/lib/api/orders';

/**
 * Panel de administración: tarjetas de resumen del catálogo y pedidos,
 * más la lista de productos con búsqueda (admin-products-list).
 */
function AdminDashboardInner() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
  });
  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
  });

  const stats = useMemo(() => {
    const all = products ?? [];
    return {
      total: all.length,
      inStock: all.filter((p) => p.availability === 'in_stock').length,
      madeToOrder: all.filter((p) => p.availability === 'made_to_order').length,
      inactive: all.filter((p) => !p.active).length,
      pendingOrders: (orders ?? []).filter((o) => o.status === 'pending').length,
    };
  }, [products, orders]);

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando panel…
      </p>
    );
  }

  const cards = [
    {
      label: 'Productos',
      value: stats.total,
      icon: Boxes,
      href: '/admin',
      hint: 'en total',
    },
    {
      label: 'En stock',
      value: stats.inStock,
      icon: PackageOpen,
      href: '/admin',
      hint: 'listos para enviar',
    },
    {
      label: 'Bajo pedido',
      value: stats.madeToOrder,
      icon: Truck,
      href: '/admin',
      hint: 'a medida',
    },
    {
      label: 'Pedidos pendientes',
      value: stats.pendingOrders,
      icon: Search,
      href: '/admin/pedidos',
      hint: 'por atender',
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Panel de administración
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona el catálogo y los pedidos de Kiva Studio.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-lg border border-border bg-background p-4 shadow-soft transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <c.icon className="size-5 text-primary-strong" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{c.hint}</span>
            </div>
            <p className="mt-3 font-heading text-3xl font-bold text-foreground">
              {c.value}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
          </a>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background p-6 shadow-soft sm:p-8">
        <AdminProductsList />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <QueryProvider>
      <AdminDashboardInner />
    </QueryProvider>
  );
}