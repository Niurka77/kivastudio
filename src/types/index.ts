/**
 * Tipos de dominio del proyecto (DDD adaptado).
 * Fuente única de verdad de los contratos de datos de la UI.
 * El tipo `Product` SE DERIVA del esquema Zod (`src/schemas/product.ts`)
 * para garantizar coherencia con la validación en runtime (ADR A.5 / 02 §12.4).
 */

export type { Product, CreateProductInput, UpdateProductInput } from '@/schemas/product';

export type Availability = 'in_stock' | 'made_to_order';

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface AddToCartPayload {
  productId: string;
  quantity?: number;
}
