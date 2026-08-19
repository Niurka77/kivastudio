import type { CreateVideoInput, UpdateVideoInput, Video } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de videos de las creaciones desde el cliente.
 * - fetchVideos: público (lee los activos). En el panel admin devuelve todos.
 * - createVideo / updateVideo / deleteVideo: solo admin de videos o la dueña.
 */

export async function fetchVideos(): Promise<Video[]> {
  const res = await fetch('/api/videos');
  if (!res.ok) {
    throw new Error('No se pudieron cargar los videos');
  }
  return res.json() as Promise<Video[]>;
}

export async function createVideo(input: CreateVideoInput): Promise<Video> {
  const token = await getAccessToken();
  const res = await fetch('/api/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para subir videos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo publicar el video');
  }
  return res.json() as Promise<Video>;
}

export async function updateVideo(id: string, input: UpdateVideoInput): Promise<Video> {
  const token = await getAccessToken();
  const res = await fetch(`/api/videos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para editar videos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar el video');
  }
  return res.json() as Promise<Video>;
}

export async function deleteVideo(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`/api/videos/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para eliminar videos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo eliminar el video');
  }
}