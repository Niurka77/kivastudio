import { z } from 'zod';

/**
 * Esquemas Zod del dominio Sección de la portada.
 * Permiten editar título/fondo (textura) de cada sección desde el panel sin
 * tocar código: hero, welcome, videos, products, about, testimonials,
 * instagram y contact.
 */

export const sectionKeySchema = z.enum([
  'hero',
  'welcome',
  'videos',
  'products',
  'about',
  'testimonials',
  'instagram',
  'contact',
  'faq',
  'footer',
]);

export const textAlignSchema = z.enum(['left', 'center', 'right']);

export const sectionSchema = z.object({
  id: z.string().min(1),
  key: sectionKeySchema,
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  backgroundUrl: z.string().nullable().optional(),
  textAlign: textAlignSchema.nullable().optional(),
  decorationLeft: z.string().nullable().optional(),
  decorationRight: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Entrada para actualizar una sección (solo la dueña). */
export const updateSectionSchema = z
  .object({
    title: z.string().trim().max(120).nullable().optional(),
    subtitle: z.string().trim().max(300).nullable().optional(),
    backgroundUrl: z.string().trim().nullable().optional(),
    textAlign: textAlignSchema.nullable().optional(),
    decorationLeft: z.string().trim().nullable().optional(),
    decorationRight: z.string().trim().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Debes enviar al menos un campo a actualizar');

export type SiteSection = z.infer<typeof sectionSchema>;
export type SectionKey = z.infer<typeof sectionKeySchema>;
export type TextAlign = z.infer<typeof textAlignSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;