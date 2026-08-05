import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart';

/**
 * Botón de añadir al carrito (CLIENT STATE -> Zustand, ADR A.1).
 * Feedback visual inmediato (check + tílda) que se revierte tras 1s,
 * y abre el carrito para que el usuario vea su selección.
 */
export default function AddToCartButton({ productId }: { productId: string }) {
  const { addLine, openCart } = useCartStore();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addLine(productId, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1000);
    openCart();
  };

  return (
    <Button
      size="sm"
      variant={added ? 'default' : 'outline'}
      onClick={handleClick}
      className="w-full"
    >
      {added ? (
        <>
          <Check className="size-4" aria-hidden="true" /> ¡Añadido!
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" /> Añadir al carrito
        </>
      )}
    </Button>
  );
}
