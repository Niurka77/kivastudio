import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AVAILABILITY_META } from '@/lib/availability';
import { formatPrice } from '@/lib/price';
import { deleteProduct, fetchProducts } from '@/lib/api/products';

/**
 * Listado de productos del panel admin (server state -> TanStack Query).
 * Muestra los productos (incluidos inactivos) con acciones de editar y eliminar.
 */
function AdminProductsListInner() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
  });

  const mutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-destructive">
        No se pudo cargar: {queryError instanceof Error ? queryError.message : 'error'}
      </p>
    );
  }

  const products = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Productos ({products.length})
        </h2>
        <a href="/admin/nuevo">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" aria-hidden="true" /> Nuevo
          </Button>
        </a>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Aún no hay productos. Crea el primero.
        </p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const meta = AVAILABILITY_META[p.availability];
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-lg border border-border p-3"
              >
                <img
                  src={p.imageUrl ?? '/logo.webp'}
                  alt={p.name}
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatPrice(p.price)}</p>
                </div>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <a
                  href={`/admin/editar/${p.id}`}
                  aria-label={`Editar ${p.name}`}
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <Pencil className="size-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar ${p.name}`}
                  disabled={deletingId === p.id}
                  onClick={() => {
                    setError(null);
                    if (
                      !window.confirm(`¿Eliminar "${p.name}"? Esta acción no se deshace.`)
                    )
                      return;
                    setDeletingId(p.id);
                    mutation.mutate(p.id, {
                      onError: (e) =>
                        setError(e instanceof Error ? e.message : 'No se pudo eliminar'),
                    });
                  }}
                >
                  {deletingId === p.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-4 text-destructive" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdminProductsList() {
  return (
    <QueryProvider>
      <AdminProductsListInner />
    </QueryProvider>
  );
}
