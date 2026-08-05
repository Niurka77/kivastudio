import { useSyncExternalStore } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore, selectCartCount } from '@/stores/cart';

const subscribe = () => () => {};
const getServerSnapshot = () => 0;
const getClientSnapshot = () => selectCartCount(useCartStore.getState());

/**
 * Icono del carrito con contador en vivo.
 * Usa `useSyncExternalStore` para que el badge no genere discrepancias
 * de hidratación en SSR (ADR B.4: cliente = Zustand; servidor = 0).
 */
export function CartIcon() {
  const count = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return (
    <span className="relative inline-flex">
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  );
}
