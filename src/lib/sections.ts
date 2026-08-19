import type { CSSProperties } from 'react';
import type { SectionKey, SiteSection, TextAlign } from '@/types';

/**
 * Helpers de presentación para las secciones editables de la portada.
 * El panel admin puede cambiar título, subtítulo, fondo (textura), alineación
 * y decoraciones (imágenes izquierda/derecha) de cada sección sin tocar código.
 */

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Inicio (Hero)',
  welcome: 'Video de bienvenida',
  videos: 'Videos de las creaciones',
  products: 'Productos',
  about: 'Nosotros',
  testimonials: 'Testimonios',
  instagram: 'Sigue el día a día',
  contact: 'Contacto',
  faq: 'Preguntas frecuentes',
  footer: 'Pie de página (footer)',
};

/** Alineación por defecto según el diseño original de cada sección. */
export const DEFAULT_SECTION_ALIGN: Record<SectionKey, TextAlign> = {
  hero: 'left',
  welcome: 'center',
  videos: 'left',
  products: 'left',
  about: 'left',
  testimonials: 'center',
  instagram: 'left',
  contact: 'center',
  faq: 'center',
  footer: 'center',
};

/** Alineación efectiva: la guardada o, si no, la original de la sección. */
export function sectionAlign(
  section: SiteSection | undefined,
  fallback?: TextAlign,
): TextAlign {
  const v = section?.textAlign;
  if (v === 'left' || v === 'center' || v === 'right') return v;
  if (fallback) return fallback;
  if (section?.key) return DEFAULT_SECTION_ALIGN[section.key] ?? 'left';
  return 'left';
}

/** Clases de texto para Astro según la alineación. */
export function sectionAlignClass(align: TextAlign): string {
  return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
}

/** Clases de justificación para filas de botones/acciones. */
export function sectionJustifyClass(align: TextAlign): string {
  return align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
}

/** Estilo de texto (objeto) para islas React según la alineación. */
export function sectionTextAlignStyle(align: TextAlign): CSSProperties {
  return { textAlign: align };
}

/** ¿Tiene decoraciones (imágenes laterales)? */
export function sectionHasDecor(section: SiteSection | undefined): boolean {
  return Boolean(section?.decorationLeft || section?.decorationRight);
}

/**
 * Título de la sección (o su valor por defecto si no se ha personalizado).
 */
export function sectionTitle(
  section: SiteSection | undefined,
  fallback: string,
): string {
  return section?.title?.trim() ? section.title : fallback;
}

/** Subtítulo de la sección (o su valor por defecto si no se ha personalizado). */
export function sectionSubtitle(
  section: SiteSection | undefined,
  fallback?: string,
): string | undefined {
  return section?.subtitle?.trim() ? section.subtitle : fallback;
}

/** Estilo CSS (string) para componentes Astro: fondo de textura si existe. */
export function sectionBgCss(bg: string | null | undefined): string | undefined {
  if (!bg) return undefined;
  return `background-image:url("${bg}");background-size:cover;background-position:center;`;
}

/** Estilo CSS (objeto) para islas React: fondo de textura si existe. */
export function sectionBgStyle(
  bg: string | null | undefined,
): CSSProperties | undefined {
  if (!bg) return undefined;
  return {
    backgroundImage: `url("${bg}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

/**
 * Muestra un overlay claro sobre el fondo con textura para que el texto se
 * siga leyendo bien (se usa junto a `sectionBg*`).
 */
export function hasSectionBg(bg: string | null | undefined): boolean {
  return Boolean(bg);
}