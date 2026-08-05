import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { updateOrderSchema } from '@/schemas/order';
import type { Order } from '@/types';

/** Actualiza el estado de un pedido (solo admin). */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface OrderRow {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: unknown;
  subtotal: string | number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    currency: row.currency as 'PEN',
    status: row.status as Order['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const PATCH: APIRoute = async ({ request, params }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }

  const id = params.id;
  if (!id) {
    return json({ message: 'Falta el id del pedido' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const { data, error } = await getSupabaseServiceClient()
    .from('orders')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Pedido no encontrado' }, 404);
  }
  return json(mapRow(data));
};