import type { SiteSection, UpdateSectionInput } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de secciones de la portada desde el cliente.
 * - fetchSections: público (lee las activas).
 * - updateSection: actualiza título/subtítulo/fondo de una sección (solo la dueña).
 */

export async function fetchSections(): Promise<SiteSection[]> {
  const token = await getAccessToken();
  const res = await fetch('/api/sections', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('No se pudieron cargar las secciones');
  }
  return res.json() as Promise<SiteSection[]>;
}

export async function updateSection(
  key: string,
  input: UpdateSectionInput,
): Promise<SiteSection> {
  const token = await getAccessToken();
  const res = await fetch('/api/sections', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ key, ...input }),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para editar las secciones');
  }
  if (res.status === 403) {
    throw new Error('Solo la dueña (Kaili) puede editar las secciones.');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar la sección');
  }
  return res.json() as Promise<SiteSection>;
}