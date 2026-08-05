import { z } from 'zod';

/**
 * Esquemas Zod del dominio Pedido/Orden.
 * Los pedidos se crean públicamente (cliente) al finalizar por WhatsApp y se
 * listan en el panel admin. Las escrituras van por el servidor (service role);
 * RLS bloquea el acceso anónimo (ver 0003_orders.sql).
 */

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'delivered', 'cancelled']);

export const orderLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

/** Pedido persistido. */
export const orderSchema = z.object({
  id: z.string().min(1),
  customerName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  items: z.array(orderLineSchema),
  subtotal: z.number().nonnegative(),
  currency: z.literal('PEN'),
  status: orderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Entrada para CREAR un pedido (público, sin id/status/createdAt). */
export const createOrderSchema = z.object({
  customerName: z.string().trim().max(120).optional().nullable(),
  customerPhone: z.string().trim().max(30).optional().nullable(),
  items: z.array(orderLineSchema).min(1, 'El pedido debe tener al menos un artículo'),
  subtotal: z.number().nonnegative(),
  currency: z.literal('PEN').default('PEN'),
});

/** Entrada para actualizar el estado de un pedido (solo admin). */
export const updateOrderSchema = z.object({
  status: orderStatusSchema,
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderLine = z.infer<typeof orderLineSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;