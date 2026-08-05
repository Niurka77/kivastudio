import type { Availability } from '@/types';

/**
 * Metadatos de presentación de la disponibilidad del producto.
 * - in_stock: lista para enviar.
 * - made_to_order: fabricado bajo pedido (muestra plazo estimado).
 * Ver 02_PROJECT_ARCHITECTURE.md §81 (dos naturalezas de producto).
 */
export const AVAILABILITY_META: Record<
  Availability,
  { label: string; variant: 'soft' | 'outline' }
> = {
  in_stock: { label: 'En stock', variant: 'soft' },
  made_to_order: { label: 'Bajo pedido', variant: 'outline' },
};
