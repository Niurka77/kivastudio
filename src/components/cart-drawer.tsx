import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2, MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { QueryProvider } from '@/components/providers/query-provider';
import { useCartStore } from '@/stores/cart';
import { fetchProducts } from '@/lib/api/products';
import { formatPrice } from '@/lib/price';
import { waLink } from '@/lib/whatsapp';
import type { Product } from '@/types';

/**
 * Carrito lateral (drawer) + checkout por WhatsApp (ADR A.3).
 * - Unifica estado del carrito (Zustand) con el catálogo REAL de Supabase
 *   (TanStack Query), de modo que los productos del carrito se resuelven con
 *   los ids del backend, no con los datos seed.
 * - Al finalizar, abre WhatsApp con el resumen del pedido y vacía el carrito.
 * Nota: la persistencia en BD se conecta cuando exista el backend.
 */
function CartDrawerInner() {
  const { isOpen, closeCart, lines, setQuantity, removeLine, clear } = useCartStore(
    (s) => s,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkedOut, setCheckedOut] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });

  const handleClose = () => {
    setCheckedOut(false);
    closeCart();
  };

  const items = lines
    .map((line) => ({ line, product: products?.find((p) => p.id === line.productId) }))
    .filter((e) => e.product) as {
    line: (typeof lines)[number];
    product: Product;
  }[];

  const subtotal = items.reduce(
    (acc, { line, product }) => acc + product.price * line.quantity,
    0,
  );
  const totalQty = lines.reduce((acc, l) => acc + l.quantity, 0);

  const buildMessage = () => {
    const header = 'Hola Kiva Studio, quiero hacer el siguiente pedido:';
    const detail = items
      .map(
        ({ line, product }) =>
          `• ${product.name} x${line.quantity} — ${formatPrice(product.price)} c/u`,
      )
      .join('\n');
    const total = `Total: ${formatPrice(subtotal)}`;
    return checkedOut ? '' : [header, detail, total].join('\n');
  };

  const handleCheckout = () => {
    const url = waLink(buildMessage());
    setCheckedOut(true);
    window.open(url, '_blank', 'noopener,noreferrer');
    // Pequeño retraso para que el mensaje "Se abrió WhatsApp" se vea antes de limpiar.
    window.setTimeout(clear, 400);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l border-border bg-background p-0 shadow-soft-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Tu carrito
              {totalQty > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  ({totalQty})
                </span>
              )}
            </h2>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar carrito"
                onClick={handleClose}
              >
                <X className="size-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!products && lines.length > 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                <p className="text-sm">Cargando tu carrito…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-muted-foreground">Tu carrito está vacío.</p>
                <DialogPrimitive.Close asChild>
                  <Button variant="outline" onClick={handleClose}>
                    Explorar productos
                  </Button>
                </DialogPrimitive.Close>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map(({ line, product }) => {
                  const isRemoving = removing === line.productId;
                  const lineTotal = product.price * line.quantity;
                  return (
                    <li
                      key={line.productId}
                      className={`flex gap-4 rounded-lg border border-border p-3 transition-opacity ${isRemoving ? 'opacity-50' : ''}`}
                    >
                      <img
                        src={product.imageUrl ?? '/logo.webp'}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {product.name}
                          </h3>
                          <button
                            type="button"
                            aria-label={`Quitar ${product.name}`}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            onClick={() => {
                              if (isRemoving || line.quantity > 1) {
                                removeLine(line.productId);
                                return;
                              }
                              setRemoving(line.productId);
                              window.setTimeout(() => {
                                removeLine(line.productId);
                                setRemoving(null);
                              }, 180);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(product.price)}
                        </span>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1 rounded-md border border-border">
                            <button
                              type="button"
                              aria-label="Disminuir cantidad"
                              className="p-1.5 text-muted-foreground transition-colors hover:text-primary-strong"
                              onClick={() =>
                                setQuantity(line.productId, line.quantity - 1)
                              }
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar cantidad"
                              className="p-1.5 text-muted-foreground transition-colors hover:text-primary-strong"
                              onClick={() =>
                                setQuantity(line.productId, line.quantity + 1)
                              }
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-primary-strong">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-heading text-lg font-bold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {checkedOut ? (
                <p className="rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
                  Se abrió WhatsApp para confirmar tu pedido. ¡Gracias!
                </p>
              ) : (
                <Button className="w-full gap-2" size="lg" onClick={handleCheckout}>
                  <MessageCircle className="size-5" aria-hidden="true" />
                  Finalizar por WhatsApp
                </Button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default function CartDrawer() {
  return (
    <QueryProvider>
      <CartDrawerInner />
    </QueryProvider>
  );
}
