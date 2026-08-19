import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { adminCan, getAdminUser } from '@/lib/auth/server-auth';
import { createVideoSchema } from '@/schemas/video';
import { notifyNewVideo } from '@/lib/notify';
import type { Video } from '@/types';

/**
 * Server endpoint de videos de las creaciones.
 * - GET:  el público lee los activos; un admin autenticado ve todos.
 * - POST: crea un video (solo admin de videos o la dueña).
 */
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

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  const supabase = getSupabaseServiceClient();

  let query = supabase.from('videos').select('*');
  if (!admin) {
    query = query.eq('active', true);
  }
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json((data ?? []).map(mapRow));
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!adminCan(admin, 'videos', 'editor')) {
    return json({ message: 'No autorizado: solo la dueña o la hermana de videos.' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const { data, error } = await getSupabaseServiceClient()
    .from('videos')
    .insert({
      title: d.title,
      description: d.description ?? null,
      video_url: d.videoUrl,
      thumbnail_url: d.thumbnailUrl ?? null,
      active: d.active ?? true,
    })
    .select()
    .single();

  if (error) {
    return json({ message: error.message }, 500);
  }

  // Avisa a la dueña por correo (no bloquea la respuesta).
  void notifyNewVideo({ title: d.title });

  return json(mapRow(data), 201);
};