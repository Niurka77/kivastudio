import type { CSSProperties } from 'react';
import type { SectionKey, SiteSection } from '@/types';

/**
 * Helpers de presentación para las secciones editables de la portada.
 * El panel admin puede cambiar título y fondo (textura) de cada sección;
 * estos helpers aplican esos valores sin tocar código.
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
};

/** Título de la sección (o su valor por defecto si no se ha personalizado). */
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