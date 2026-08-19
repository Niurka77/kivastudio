import type { APIRoute } from 'astro';
import {
  fetchPrivateBlob,
  isMediaKey,
  MEDIA_REGISTRY,
  verifyToken,
} from '@/lib/media';

/**
 * Sirve un medio privado (video de bienvenida / foto de la artesana) con
 * protección por token firmado de corta duración (header `Authorization`).
 *
 * El archivo vive en un store PRIVADO de Vercel Blob; el servidor lo descarga
 * con el token de lectura/escritura y reenvía el stream al navegador. El cliente
 * nunca ve la URL del blob.
 *
 * Medidas anti-descarga:
 * - No existe URL pública: el blob es privado (sin token responde 403).
 * - `Cache-Control: no-store` + `private`: el navegador no lo persiste en disco.
 * - `Content-Disposition: inline` (nunca `attachment`).
 * - Soporte de HTTP Range para que el reproductor no se descargue todo de golpe.
 */
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const file = url.searchParams.get('file') ?? '';

  if (!isMediaKey(file)) {
    return empty(404);
  }

  const token = bearerToken(request.headers.get('authorization'));
  if (!token || !verifyToken(token, file)) {
    return empty(401);
  }

  const range = request.headers.get('range');
  let blob: Response;
  try {
    blob = await fetchPrivateBlob(MEDIA_REGISTRY[file].url, range);
  } catch {
    return empty(500);
  }

  if (blob.status !== 200 && blob.status !== 206) {
    return empty(404);
  }

  const headers = new Headers();
  headers.set('Content-Type', `${MEDIA_REGISTRY[file].mime}; charset=utf-8`);
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Accept-Ranges', 'bytes');

  const contentLength = blob.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);
  const contentRange = blob.headers.get('content-range');
  if (contentRange) headers.set('Content-Range', contentRange);

  return new Response(blob.body, { status: blob.status, headers });
};

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

function empty(status: number): Response {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}