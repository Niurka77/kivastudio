import type { Product } from '@/types';

/**
 * Catálogo seed (Sprint 4).
 * Datos de ejemplo para diseñar la UI del listado mientras no hay Supabase.
 * Cuando se conecte la BD, este archivo se sustituye por una consulta TanStack
 * Query contra `/catalogo` (ADR A.1 / 02 §7.13).
 * Ver `02_PROJECT_ARCHITECTURE.md` §81 (dos naturalezas: en stock / bajo pedido).
 */
export const PRODUCTS: Product[] = [
  {
    id: 'amigurumi-conejito-luna',
    slug: 'amigurumi-conejito-luna',
    name: 'Amigurumi Conejito Luna',
    description: 'Amigurumi suave tejido a mano, ideal para regalar o decorar.',
    price: 85,
    currency: 'PEN',
    availability: 'in_stock',
    categoryId: 'amigurumis',
    imageUrl: '/images/products/product-1.svg',
    gallery: [
      '/images/products/product-1.svg',
      '/images/products/product-2.svg',
      '/images/products/product-5.svg',
    ],
    active: true,
  },
  {
    id: 'amigurumi-osito-martin',
    slug: 'amigurumi-osito-martin',
    name: 'Amigurumi Osito Martín',
    description: 'Osito de crochet con su jersey, cada uno con su personalidad.',
    price: 95,
    currency: 'PEN',
    availability: 'in_stock',
    categoryId: 'amigurumis',
    imageUrl: '/images/products/product-2.svg',
    gallery: [
      '/images/products/product-2.svg',
      '/images/products/product-1.svg',
      '/images/products/product-6.svg',
    ],
    active: true,
  },
  {
    id: 'bolso-tejido-marina',
    slug: 'bolso-tejido-marina',
    name: 'Bolso Tejido Marina',
    description: 'Bolso artesanal teñido a mano, resistente y con estilo.',
    price: 120,
    currency: 'PEN',
    availability: 'in_stock',
    categoryId: 'bolsos',
    imageUrl: '/images/products/product-3.svg',
    gallery: [
      '/images/products/product-3.svg',
      '/images/products/product-4.svg',
      '/images/products/product-1.svg',
    ],
    active: true,
  },
  {
    id: 'chaleco-tejido-aura',
    slug: 'chaleco-tejido-aura',
    name: 'Chaleco Tejido Aura',
    description: 'Chaleco a medida, fabricado bajo pedido con tu color favorito.',
    price: 160,
    currency: 'PEN',
    availability: 'made_to_order',
    leadTime: 10,
    categoryId: 'ropa',
    imageUrl: '/images/products/product-4.svg',
    gallery: [
      '/images/products/product-4.svg',
      '/images/products/product-3.svg',
      '/images/products/product-2.svg',
    ],
    active: true,
  },
  {
    id: 'pulsera-nudo-cresta',
    slug: 'pulsera-nudo-cresta',
    name: 'Pulsera de Nudo Cresta',
    description: 'Pulsera tejida a mano, perfecta para cada día.',
    price: 25,
    currency: 'PEN',
    availability: 'in_stock',
    categoryId: 'accesorios',
    imageUrl: '/images/products/product-5.svg',
    gallery: [
      '/images/products/product-5.svg',
      '/images/products/product-6.svg',
      '/images/products/product-1.svg',
    ],
    active: true,
  },
  {
    id: 'amigurumi-personalizado',
    slug: 'amigurumi-personalizado',
    name: 'Amigurumi Personalizado',
    description: 'Creamos tu amigurumi a medida: colores, nombre y detalles únicos.',
    price: 70,
    currency: 'PEN',
    availability: 'made_to_order',
    leadTime: 7,
    categoryId: 'personalizados',
    imageUrl: '/images/products/product-6.svg',
    gallery: [
      '/images/products/product-6.svg',
      '/images/products/product-5.svg',
      '/images/products/product-2.svg',
    ],
    active: true,
  },
];

/** Busca un producto por id (catálogo seed; luego se reemplaza por consulta server). */
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
