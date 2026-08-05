import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { updateReviewSchema } from '@/schemas/review';
import type { Review } from '@/types';

/** Ruta dinámica de reseña (solo servidor). */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface ReviewRow {
  id: string;
  name: string;
  detail: string | null;
  review: string;
  rating: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ReviewRow): Review {
  return {
    id: row.id,
    name: row.name,
    detail: row.detail,
    review: row.review,
    rating: row.rating,
    imageUrl: row.image_url,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Actualiza una reseña (solo admin). */
export const PATCH: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id de la reseña' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = updateReviewSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.name !== undefined) patch.name = d.name;
  if (d.detail !== undefined) patch.detail = d.detail;
  if (d.review !== undefined) patch.review = d.review;
  if (d.rating !== undefined) patch.rating = d.rating;
  if (d.imageUrl !== undefined) patch.image_url = d.imageUrl;
  if (d.active !== undefined) patch.active = d.active;

  const { data, error } = await getSupabaseServiceClient()
    .from('reviews')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Reseña no encontrada' }, 404);
  }
  return json(mapRow(data));
};

/** Elimina una reseña (solo el admin dueño). */
export const DELETE: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }
  if (admin.role !== 'owner') {
    return json({ message: 'Solo la dueña (Kaili) puede eliminar reseñas.' }, 403);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id de la reseña' }, 400);
  }

  const { error } = await getSupabaseServiceClient().from('reviews').delete().eq('id', id);
  if (error) {
    return json({ message: error.message }, 500);
  }
  return json({ ok: true }, 200);
};
