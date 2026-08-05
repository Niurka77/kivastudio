import { z } from 'zod';

/**
 * Esquemas Zod del dominio Reseña/Testimonio.
 * Las reseñas las crean los clientes desde la tienda (público, sin foto) o la
 * dueña desde el panel (con foto, para clientes que ya compraron antes).
 */

export const reviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  detail: z.string().nullable().optional(),
  review: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Entrada para crear una reseña (pública o desde el panel admin). */
export const createReviewSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre'),
  detail: z.string().trim().max(120).optional().nullable(),
  review: z.string().trim().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)'),
  rating: z.number().int().min(1, 'Elige una calificación').max(5),
  imageUrl: z.string().trim().optional().nullable(),
});

/** Entrada para actualizar una reseña (todos opcionales, al menos uno). */
export const updateReviewSchema = reviewSchema
  .partial()
  .refine(
    (v) => Object.keys(v).length > 0,
    'Debes enviar al menos un campo a actualizar',
  );

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
