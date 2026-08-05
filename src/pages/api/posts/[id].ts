import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { updatePostSchema } from '@/schemas/post';
import type { Post } from '@/types';

/** Ruta dinámica de publicación (solo servidor). */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface PostRow {
  id: string;
  title: string | null;
  body: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Actualiza una publicación (solo admin). */
export const PATCH: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id de la publicación' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.title !== undefined) patch.title = d.title;
  if (d.body !== undefined) patch.body = d.body;
  if (d.mediaUrl !== undefined) patch.media_url = d.mediaUrl;
  if (d.mediaType !== undefined) patch.media_type = d.mediaType;
  if (d.active !== undefined) patch.active = d.active;

  const { data, error } = await getSupabaseServiceClient()
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Publicación no encontrada' }, 404);
  }
  return json(mapRow(data));
};

/** Elimina una publicación (solo el admin dueño). */
export const DELETE: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }
  if (admin.role !== 'owner') {
    return json({ message: 'Solo la dueña (Kaili) puede eliminar publicaciones.' }, 403);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id de la publicación' }, 400);
  }

  const { error } = await getSupabaseServiceClient().from('posts').delete().eq('id', id);
  if (error) {
    return json({ message: error.message }, 500);
  }
  return json({ ok: true }, 200);
};
