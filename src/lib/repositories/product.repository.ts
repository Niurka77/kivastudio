import type { CreateProductInput, Product, UpdateProductInput } from '@/types';
import { PRODUCTS, getProductById } from '@/data/products';

/**
 * Puerta de acceso al almacenamiento de productos (Repository pattern).
 *
 * La UI y el núcleo dependen de esta interfaz, NO de un backend concreto
 * (Clean Architecture / 02 §4). Hoy hay una implementación "seed" (lectura
 * sobre datos locales) para diseñar el catálogo sin backend.
 *
 * La implementación real (Supabase + TanStack Query, ADR A.1) se incorpora en
 * el sprint del panel admin. Hasta entonces, las escrituras lanzan un error
 * claro para no persistir de forma engañosa (YAGNI vs. no mentir al estado).
 */
export interface ProductRepository {
  list(): Product[];
  getById(id: string): Product | undefined;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
  remove(id: string): Promise<void>;
}

class SeedProductRepository implements ProductRepository {
  list(): Product[] {
    return PRODUCTS;
  }

  getById(id: string): Product | undefined {
    return getProductById(id);
  }

  async create(_input: CreateProductInput): Promise<Product> {
    throw new Error(
      'Persistencia no conectada: la creación de productos requiere Supabase (sprint del panel admin).',
    );
  }

  async update(_id: string, _input: UpdateProductInput): Promise<Product> {
    throw new Error(
      'Persistencia no conectada: la actualización de productos requiere Supabase.',
    );
  }

  async remove(_id: string): Promise<void> {
    throw new Error('Persistencia no conectada: eliminar productos requiere Supabase.');
  }
}

/** Repositorio activo del catálogo (hoy seed). */
export const productRepository: ProductRepository = new SeedProductRepository();
