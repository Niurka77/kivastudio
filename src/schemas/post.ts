import { z } from 'zod';

/**
 * Esquemas Zod del dominio Publicación/Avance (día a día del taller).
 * La dueña sube fotos/videos del proceso de cada pedido desde el panel admin
 * y aparecen en la tienda en la sección "Sigue el día a día".
 */

export const mediaTypeSchema = z.enum(['image', 'video']);

export const postSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  mediaUrl: z.string().min(1),
  mediaType: mediaTypeSchema,
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Entrada para crear una publicación (solo admin). */
export const createPostSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().max(600).optional().nullable(),
  mediaUrl: z.string().min(1, 'Sube una foto o video'),
  mediaType: mediaTypeSchema.default('image'),
  active: z.boolean().optional(),
});

/** Entrada para actualizar una publicación (todos opcionales, al menos uno). */
export const updatePostSchema = createPostSchema
  .partial()
  .refine(
    (v) => Object.keys(v).length > 0,
    'Debes enviar al menos un campo a actualizar',
  );

export type Post = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
