import { z } from 'zod';

/**
 * Esquemas Zod del dominio Producto (ADR A.5 / 02 §12.4).
 * Son la fuente única de verdad: el tipo `Product` se deriva con `z.infer`
 * y la UI/núcleo la acceden, garantizando coherencia entre validación en
 * runtime y compilación.
 *
 * El `createProductSchema` es la entrada validada para CREAR un producto
 * (la "lógica de creación" que usa el panel admin; la persistencia a Supabase
 * se conecta en el sprint de admin).
 */

export const availabilitySchema = z.enum(['in_stock', 'made_to_order']);

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  currency: z.literal('PEN'),
  availability: availabilitySchema,
  leadTime: z.number().int().positive().nullable().optional(),
  categoryId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  gallery: z.array(z.string()).nullable().optional(),
  active: z.boolean(),
});

/** Entrada para crear un producto: `id` y `active` se derivan internamente. */
export const createProductSchema = productSchema.omit({ id: true, active: true }).extend({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug inválido (usa minúsculas y guiones)'),
  price: z
    .number({ message: 'El precio es obligatorio' })
    .positive('El precio debe ser mayor a 0'),
});

/** Entrada para actualizar un producto (todos opcionales, al menos uno). */
export const updateProductSchema = productSchema
  .partial()
  .refine(
    (v) => Object.keys(v).length > 0,
    'Debes enviar al menos un campo a actualizar',
  );

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
