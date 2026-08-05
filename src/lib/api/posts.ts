import type { CreatePostInput, Post, UpdatePostInput } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de publicaciones (día a día del taller) desde el cliente.
 * - fetchPosts: público (lee las activas). En el panel admin devuelve todas.
 * - createPost / updatePost / deletePost: solo admin.
 */

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  if (!res.ok) {
    throw new Error('No se pudieron cargar las novedades');
  }
  return res.json() as Promise<Post[]>;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const token = await getAccessToken();
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para publicar');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo publicar');
  }
  return res.json() as Promise<Post>;
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  const token = await getAccessToken();
  const res = await fetch(`/api/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para editar publicaciones');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar la publicación');
  }
  return res.json() as Promise<Post>;
}

export async function deletePost(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para eliminar publicaciones');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo eliminar la publicación');
  }
}
