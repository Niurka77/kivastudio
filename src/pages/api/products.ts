import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { adminCan, getAdminUser } from '@/lib/auth/server-auth';
import { createProductSchema } from '@/schemas/product';
import type { Product } from '@/types';

/**
 * Server endpoint del catálogo (solo se ejecuta en el servidor).
 * - GET:  lista de productos activos (el navegador también podría leer con la
 *         anon key + RLS, pero centralizamos en la API para un solo contrato).
 * - POST: crea un producto validando con Zod (service role, salta RLS).
 * Ver 02_PROJECT_ARCHITECTURE.md §7.13 y ADR A.5.
 */
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

export const GET: APIRoute = async () => {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json((data ?? []).map(mapRow));
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!adminCan(admin, 'products', 'editor')) {
    return json({ message: 'No autorizado: se requiere iniciar sesión como admin' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      slug: d.slug,
      name: d.name,
      description: d.description ?? null,
      price: d.price,
      currency: d.currency,
      availability: d.availability,
      lead_time: d.leadTime ?? null,
      category_id: d.categoryId,
      image_url: d.imageUrl ?? null,
      gallery: d.gallery ?? [],
      active: true,
    })
    .select()
    .single();

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json(mapRow(data), 201);
};
