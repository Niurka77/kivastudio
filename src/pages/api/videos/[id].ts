import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { adminCan, getAdminUser } from '@/lib/auth/server-auth';
import { updateVideoSchema } from '@/schemas/video';
import type { Video } from '@/types';

/** Ruta dinámica de video de creación (solo servidor). */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: VideoRow): Video {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Actualiza un video (solo admin de videos o la dueña). */
export const PATCH: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!adminCan(admin, 'videos', 'editor')) {
    return json({ message: 'No autorizado' }, 401);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id del video' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = updateVideoSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.title !== undefined) patch.title = d.title;
  if (d.description !== undefined) patch.description = d.description;
  if (d.videoUrl !== undefined) patch.video_url = d.videoUrl;
  if (d.thumbnailUrl !== undefined) patch.thumbnail_url = d.thumbnailUrl;
  if (d.active !== undefined) patch.active = d.active;

  const { data, error } = await getSupabaseServiceClient()
    .from('videos')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Video no encontrado' }, 404);
  }
  return json(mapRow(data));
};

/** Elimina un video (solo la dueña). */
export const DELETE: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }
  if (admin.role !== 'owner') {
    return json({ message: 'Solo la dueña (Kaili) puede eliminar videos.' }, 403);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id del video' }, 400);
  }

  const { error } = await getSupabaseServiceClient().from('videos').delete().eq('id', id);
  if (error) {
    return json({ message: error.message }, 500);
  }
  return json({ ok: true }, 200);
};