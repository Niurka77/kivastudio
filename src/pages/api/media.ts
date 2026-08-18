import { readFile } from 'node:fs/promises';
import type { APIRoute } from 'astro';
import { isMediaKey, mediaPath, MEDIA_REGISTRY, verifyToken } from '@/lib/media';

/**
 * Sirve un medio privado (video de bienvenida / foto de la artesana) con
 * protección por token firmado de corta duración (header `Authorization`).
 *
 * Medidas anti-descarga:
 * - No existe URL estática pública: el archivo vive en `private-media/`.
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

  let buffer: Buffer;
  try {
    buffer = await readFile(mediaPath(file));
  } catch {
    return empty(404);
  }

  const size = buffer.length;
  const rangeHeader = request.headers.get('range');
  const { status, headers, body } = sliceRange(buffer, size, rangeHeader);

  headers.set('Content-Type', `${MEDIA_REGISTRY[file].mime}; charset=utf-8`);
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Accept-Ranges', 'bytes');

  return new Response(body, { status, headers });
};

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

function sliceRange(
  buffer: Buffer,
  size: number,
  rangeHeader: string | null,
): { status: number; headers: Headers; body: Uint8Array<ArrayBuffer> } {
  const headers = new Headers();

  if (!rangeHeader) {
    headers.set('Content-Length', String(size));
    return { status: 200, headers, body: Uint8Array.from(buffer) };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return { status: 416, headers, body: new Uint8Array() };
  }

  let start: number;
  let end: number;

  if (match[1] === '' && match[2] === '') {
    return { status: 416, headers, body: new Uint8Array() };
  }

  if (match[1] === '') {
    // Rango sufijo: "bytes=-500" => últimos 500 bytes
    const suffix = Number(match[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Number(match[2]);
  }

  if (start > end || start >= size) {
    headers.set('Content-Range', `bytes */${size}`);
    return { status: 416, headers, body: new Uint8Array() };
  }

  end = Math.min(end, size - 1);
  const body = Uint8Array.from(buffer.subarray(start, end + 1));

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(body.length));

  return { status: 206, headers, body };
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
