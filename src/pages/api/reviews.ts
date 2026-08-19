import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { createReviewSchema } from '@/schemas/review';
import { notifyNewReview } from '@/lib/notify';
import type { Review } from '@/types';

/**
 * Server endpoint de reseñas (solo servidor).
 * - GET:  el público lee las activas; un admin autenticado ve todas.
 * - POST: crea una reseña. Si es un cliente (sin auth) se guarda activa y sin
 *         foto; si es admin puede incluir imageUrl (clientes que ya compraron).
 */
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

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  const supabase = getSupabaseServiceClient();

  let query = supabase.from('reviews').select('*');
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const isAdmin = admin != null;
  const { data, error } = await getSupabaseServiceClient()
    .from('reviews')
    .insert({
      name: d.name,
      detail: d.detail ?? null,
      review: d.review,
      rating: d.rating,
      image_url: isAdmin ? (d.imageUrl ?? null) : null,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return json({ message: error.message }, 500);
  }

  // Avisa a la dueña por correo (no bloquea la respuesta).
  void notifyNewReview({ name: d.name, rating: d.rating });

  return json(mapRow(data), 201);
};
