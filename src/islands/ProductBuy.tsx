import { useState } from 'react';
import { Check, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/price';
import { useCartStore } from '@/stores/cart';
import { waLink } from '@/lib/whatsapp';
import type { Product } from '@/types';

/**
 * Compra en la página propia de producto: cantidad, añadir al carrito y
 * consultar por WhatsApp. Usa el mismo store del carrito que el catálogo.
 */
export default function ProductBuy({ product }: { product: Product }) {
  const { addLine, openCart } = useCartStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addLine(product.id, qty);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      openCart();
    }, 600);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-[16px] border border-border">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            className="p-2.5 text-muted-foreground transition-colors hover:text-primary-strong"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            className="p-2.5 text-muted-foreground transition-colors hover:text-primary-strong"
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button size="lg" className="flex-1 gap-2" onClick={handleAdd}>
          {added ? (
            <>
              <Check className="size-5" aria-hidden="true" /> ¡Añadido!
            </>
          ) : (
            <>
              <ShoppingBag className="size-5" aria-hidden="true" /> Añadir al carrito
            </>
          )}
        </Button>
      </div>
      <a
        href={waLink(
          `Hola Kiva Studio, me interesa "${product.name}" (${formatPrice(product.price)}).`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-border bg-background p-3 text-sm font-semibold text-primary-strong transition-colors hover:bg-secondary"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Consultar este producto por WhatsApp
      </a>
    </div>
  );
}