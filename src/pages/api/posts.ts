import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { createPostSchema } from '@/schemas/post';
import type { Post } from '@/types';

/**
 * Server endpoint de publicaciones (día a día del taller).
 * - GET:  el público lee las activas; un admin autenticado ve todas.
 * - POST: crea una publicación (solo admin).
 */
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

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  const supabase = getSupabaseServiceClient();

  let query = supabase.from('posts').select('*');
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
  if (!admin) {
    return json({ message: 'No autorizado: se requiere iniciar sesión como admin' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const { data, error } = await getSupabaseServiceClient()
    .from('posts')
    .insert({
      title: d.title ?? null,
      body: d.body ?? null,
      media_url: d.mediaUrl,
      media_type: d.mediaType,
      active: d.active ?? true,
    })
    .select()
    .single();

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json(mapRow(data), 201);
};
