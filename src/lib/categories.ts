/**
 * Catálogo de categorías del negocio.
 * Fuente de verdad de las etiquetas de filtro del catálogo.
 * Coincide con los `categoryId` de la entidad `Product` (02 §81).
 */
export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: 'amigurumis', label: 'Amigurumis' },
  { id: 'bolsos', label: 'Bolsos' },
  { id: 'ropa', label: 'Ropa' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'personalizados', label: 'Personalizados' },
];

export function getCategoryLabel(id: string | null): string {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat?.label ?? 'Sin categoría';
}
