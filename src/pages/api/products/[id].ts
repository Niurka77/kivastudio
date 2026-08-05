import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { updateProductSchema } from '@/schemas/product';
import type { Product } from '@/types';

/** Ruta dinámica del producto (solo servidor). */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  availability: string;
  lead_time: number | null;
  category_id: string | null;
  image_url: string | null;
  gallery: unknown;
  active: boolean;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency as 'PEN',
    availability: row.availability as Product['availability'],
    leadTime: row.lead_time,
    categoryId: row.category_id,
    imageUrl: row.image_url,
    gallery: Array.isArray(row.gallery) ? row.gallery : null,
    active: row.active,
  };
}

/** Devuelve un producto por id (público). */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id del producto' }, 400);
  }

  const { data, error } = await getSupabaseServiceClient()
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Producto no encontrado' }, 404);
  }
  return json(mapRow(data));
};

/** Actualiza un producto (solo admin autenticado). */
export const PATCH: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id del producto' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.name !== undefined) patch.name = d.name;
  if (d.slug !== undefined) patch.slug = d.slug;
  if (d.description !== undefined) patch.description = d.description;
  if (d.price !== undefined) patch.price = d.price;
  if (d.currency !== undefined) patch.currency = d.currency;
  if (d.availability !== undefined) patch.availability = d.availability;
  if (d.leadTime !== undefined) patch.lead_time = d.leadTime;
  if (d.categoryId !== undefined) patch.category_id = d.categoryId;
  if (d.imageUrl !== undefined) patch.image_url = d.imageUrl;
  if (d.gallery !== undefined) patch.gallery = d.gallery;
  if (d.active !== undefined) patch.active = d.active;

  const { data, error } = await getSupabaseServiceClient()
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Producto no encontrado' }, 404);
  }
  return json(mapRow(data));
};

/** Elimina un producto (solo admin autenticado). */
export const DELETE: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return new Response(JSON.stringify({ message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ message: 'Falta el id del producto' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await getSupabaseServiceClient()
    .from('products')
    .delete()
    .eq('id', id);
  if (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
