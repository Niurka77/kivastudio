/**
 * Tipos de dominio del proyecto (DDD adaptado).
 * Fuente única de verdad de los contratos de datos de la UI.
 * Se derivan de los esquemas Zod definidos en src/schemas (ADR A.5 / 02 §12.4).
 * Los tipos de negocio detallados se desarrollan en el Sprint de catálogo/BD.
 */

export type Availability = 'in_stock' | 'made_to_order';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: 'PEN';
  availability: Availability;
  leadTime?: number | null; // días estimados de fabricación (made_to_order)
  categoryId: string | null;
  imageUrl: string | null;
  active: boolean;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface AddToCartPayload {
  productId: string;
  quantity?: number;
}
