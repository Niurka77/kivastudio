import { env } from '@/lib/env';

/**
 * Enlaces de WhatsApp de la marca (checkout ágil por WhatsApp, ADR A.3).
 * El número es público y solo válido en formato internacional con dígitos.
 * Ver 02_PROJECT_ARCHITECTURE.md §8.9.
 */
export const WHATSAPP_NUMBER = env.whatsappNumber ?? '';

/** Número con prefijo `+` para mostrar en la UI. */
export const WHATSAPP_DISPLAY = WHATSAPP_NUMBER ? `+${WHATSAPP_NUMBER}` : '';

/** Crea un enlace `wa.me` listo para abrir la conversación. */
export function waLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
