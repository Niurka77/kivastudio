import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { fetchOrders, updateOrderStatus } from '@/lib/api/orders';
import { formatPrice } from '@/lib/price';
import type { Order, OrderStatus } from '@/types';

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/15 text-amber-600' },
  confirmed: { label: 'Confirmado', className: 'bg-sky-500/15 text-sky-600' },
  delivered: { label: 'Entregado', className: 'bg-emerald-500/15 text-emerald-600' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderCard({ order }: { order: Order }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(order.id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const meta = STATUS_META[order.status];

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.customerName?.trim() || 'Cliente'}
            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => mutation.mutate(e.target.value as OrderStatus)}
            disabled={mutation.isPending}
            className="h-9 rounded-[12px] border border-input bg-background px-2 text-sm font-medium"
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {order.items.map((it) => (
          <li key={it.productId} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-foreground">
              {it.name} <span className="text-muted-foreground">×{it.quantity}</span>
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {formatPrice(it.price * it.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-heading text-base font-bold text-foreground">
          {formatPrice(order.subtotal)}
        </span>
      </div>
    </li>
  );
}

function AdminOrdersListInner() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
  });

  const pendingCount = (data ?? []).filter((o) => o.status === 'pending').length;

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando pedidos…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-destructive">
        No se pudieron cargar los pedidos:{' '}
        {error instanceof Error ? error.message : 'error'}
      </p>
    );
  }

  const orders = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Pedidos ({orders.length})
        </h2>
        <span className="text-sm text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''} por atender`
            : 'Sin pendientes'}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            Aún no hay pedidos. Cuando alguien finalice por WhatsApp, aparecerá aquí.
          </p>
          <a
            href="/"
            className="mt-3 inline-block text-sm font-medium text-primary-strong hover:underline"
          >
            Ver la tienda →
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminOrdersList() {
  return (
    <QueryProvider>
      <AdminOrdersListInner />
    </QueryProvider>
  );
}