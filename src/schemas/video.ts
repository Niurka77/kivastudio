import { z } from 'zod';

/**
 * Esquemas Zod del dominio Video de creación.
 * La hermana de videos sube los videos de las creaciones desde el panel admin
 * y aparecen en la sección "Videos de las creaciones" de la tienda.
 */

export const videoSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().nullable().optional(),
  videoUrl: z.string().min(1),
  thumbnailUrl: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Entrada para crear un video (solo admin). */
export const createVideoSchema = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(120),
  description: z.string().trim().max(600).optional().nullable(),
  videoUrl: z.string().min(1, 'Sube un video'),
  thumbnailUrl: z.string().trim().optional().nullable(),
  active: z.boolean().optional(),
});

/** Entrada para actualizar un video (todos opcionales, al menos uno). */
export const updateVideoSchema = createVideoSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Debes enviar al menos un campo a actualizar');

export type Video = z.infer<typeof videoSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;