import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { createOrderSchema } from '@/schemas/order';
import type { Order } from '@/types';

/**
 * Server endpoint de pedidos.
 * - POST: público — un cliente registra su pedido al finalizar por WhatsApp.
 * - GET:  solo admin — historial de pedidos para el panel.
 * Ver 02_PROJECT_ARCHITECTURE.md §7.13 y ADR A.3.
 */
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

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const { data, error } = await getSupabaseServiceClient()
    .from('orders')
    .insert({
      customer_name: d.customerName ?? null,
      customer_phone: d.customerPhone ?? null,
      items: d.items,
      subtotal: d.subtotal,
      currency: d.currency,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json(mapRow(data), 201);
};

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado' }, 401);
  }

  const { data, error } = await getSupabaseServiceClient()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json((data ?? []).map(mapRow));
};