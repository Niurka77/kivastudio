import type { CreateOrderInput, Order, OrderStatus } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de pedidos desde el cliente.
 * - createOrder: público (se llama al finalizar el carrito por WhatsApp).
 * - fetchOrders / updateOrderStatus: solo admin (adjuntan el JWT de sesión).
 */

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo registrar el pedido');
  }
  return res.json() as Promise<Order>;
}

export async function fetchOrders(): Promise<Order[]> {
  const token = await getAccessToken();
  const res = await fetch('/api/orders', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para ver los pedidos');
  }
  if (!res.ok) {
    throw new Error('No se pudieron cargar los pedidos');
  }
  return res.json() as Promise<Order[]>;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const token = await getAccessToken();
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para actualizar pedidos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar el pedido');
  }
  return res.json() as Promise<Order>;
}