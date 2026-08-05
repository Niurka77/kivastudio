import type { CreateReviewInput, Review, UpdateReviewInput } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de reseñas desde el cliente (islas React).
 * - fetchReviews: público (lee las activas). En el panel admin devuelve todas
 *   porque el GET detecta la sesión admin.
 * - createReview: público (el cliente deja su reseña).
 * - updateReview / deleteReview: solo admin.
 */

export async function fetchReviews(): Promise<Review[]> {
  const res = await fetch('/api/reviews');
  if (!res.ok) {
    throw new Error('No se pudieron cargar las reseñas');
  }
  return res.json() as Promise<Review[]>;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo guardar tu reseña');
  }
  return res.json() as Promise<Review>;
}

export async function updateReview(id: string, input: UpdateReviewInput): Promise<Review> {
  const token = await getAccessToken();
  const res = await fetch(`/api/reviews/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para editar reseñas');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar la reseña');
  }
  return res.json() as Promise<Review>;
}

export async function deleteReview(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`/api/reviews/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para eliminar reseñas');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo eliminar la reseña');
  }
}
