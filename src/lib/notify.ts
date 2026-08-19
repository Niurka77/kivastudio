import { getAdminEmails } from '@/lib/auth/server-auth';

/**
 * Notificaciones por correo a la dueña (Resend).
 *
 * Se envían cuando llega un pedido, una reseña o un video nuevo, para que Kaili
 * reaccione sin tener que revisar el panel. Usa la API REST de Resend (sin
 * dependencias) y el plan gratuito (3.000 correos/mes).
 *
 * Configuración (solo servidor, nunca en el cliente):
 *   RESEND_API_KEY  -> clave de API de resend.com (obligatoria para enviar)
 *   RESEND_FROM     -> remitente, p. ej. "Kiva Studio <hola@kivastudio.pe>"
 *                      (por defecto onboarding@resend.dev, que solo envía al
 *                      correo de la cuenta Resend)
 *
 * Si no hay RESEND_API_KEY, las notificaciones se omiten silenciosamente para
 * no romper el flujo principal (pedido/reseña/video).
 */

export interface AdminMail {
  subject: string;
  text: string;
  html: string;
}

const ADMIN_URL = (path: string) => {
  const base = import.meta.env.PUBLIC_SITE_URL as string | undefined;
  return `${base ?? 'https://kivastudio.vercel.app'}${path}`;
};

export async function notifyAdmins(mail: AdminMail): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  if (!apiKey) return;

  const to = getAdminEmails()[0];
  if (!to) return;

  const from =
    (import.meta.env.RESEND_FROM as string | undefined) ??
    'Kiva Studio <onboarding@resend.dev>';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });
  } catch {
    // Las notificaciones nunca deben romper el flujo principal.
  }
}

/** Correo cuando un cliente registra un pedido. */
export function notifyNewOrder(opts: {
  customerName: string | null;
  items: { name: string; quantity: number }[];
  subtotal: number;
}): Promise<void> {
  const list = opts.items.map((i) => `${i.name} × ${i.quantity}`).join('<br/>');
  const subject = `Nuevo pedido · ${opts.customerName ?? 'cliente anónimo'}`;
  const text = [
    subject,
    '',
    'Artículos:',
    ...opts.items.map((i) => `- ${i.name} × ${i.quantity}`),
    `Subtotal: S/ ${opts.subtotal}`,
    `Ver pedido: ${ADMIN_URL('/admin/pedidos')}`,
  ].join('\n');
  const html = `
    <h2 style="margin:0 0 12px">Nuevo pedido 📦</h2>
    <p><strong>Cliente:</strong> ${escapeHtml(opts.customerName ?? 'Anónimo')}</p>
    <p><strong>Artículos:</strong></p>
    <ul style="margin:0 0 12px;padding-left:18px">${list}</ul>
    <p><strong>Subtotal:</strong> S/ ${opts.subtotal}</p>
    <p><a href="${ADMIN_URL('/admin/pedidos')}" style="color:#be185d">Ver pedido en el panel</a></p>
  `;
  return notifyAdmins({ subject, text, html });
}

/** Correo cuando llega una reseña nueva. */
export function notifyNewReview(opts: { name: string; rating: number }): Promise<void> {
  const subject = `Nueva reseña · ${opts.name}`;
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating);
  const text = `${subject}\n\nCalificación: ${opts.rating}/5 (${stars})\nVer: ${ADMIN_URL('/admin/resenas')}`;
  const html = `
    <h2 style="margin:0 0 12px">Nueva reseña ⭐</h2>
    <p><strong>${escapeHtml(opts.name)}</strong> calificó con ${opts.rating}/5 ${stars}</p>
    <p><a href="${ADMIN_URL('/admin/resenas')}" style="color:#be185d">Ver reseñas en el panel</a></p>
  `;
  return notifyAdmins({ subject, text, html });
}

/** Correo cuando la hermana de videos publica un video. */
export function notifyNewVideo(opts: { title: string }): Promise<void> {
  const subject = `Nuevo video · ${opts.title}`;
  const text = `${subject}\n\nVer: ${ADMIN_URL('/admin/videos')}`;
  const html = `
    <h2 style="margin:0 0 12px">Nuevo video 🎬</h2>
    <p>Se publicó el video: <strong>${escapeHtml(opts.title)}</strong></p>
    <p><a href="${ADMIN_URL('/admin/videos')}" style="color:#be185d">Ver videos en el panel</a></p>
  `;
  return notifyAdmins({ subject, text, html });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}