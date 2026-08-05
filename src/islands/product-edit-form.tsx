import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import ProductForm from '@/islands/product-form';
import { fetchProduct } from '@/lib/api/products';

/**
 * Isla de edición: carga el producto por id (GET /api/products/:id) y
 * renderiza el formulario compartido en modo edición con valores precargados.
 */
function ProductEditFormInner({ productId }: { productId: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isPending) {
    return (
      <p className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando
        producto…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-destructive">
        No se pudo cargar el producto:{' '}
        {error instanceof Error ? error.message : 'error'}
      </p>
    );
  }

  if (!data) {
    return <p className="py-10 text-muted-foreground">No existe ese producto.</p>;
  }

  return <ProductForm product={data} />;
}

export default function ProductEditForm({ productId }: { productId: string }) {
  return (
    <QueryProvider>
      <ProductEditFormInner productId={productId} />
    </QueryProvider>
  );
}
