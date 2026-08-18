import type { APIRoute } from 'astro';
import { isMediaKey, MEDIA_REGISTRY, MEDIA_TOKEN_TTL_MS, signToken } from '@/lib/media';

/**
 * Emite un token firmado de corta duración para acceder a un medio privado
 * (video de bienvenida / foto de la artesana). El token es de un solo medio,
 * expira en ~90 s y va en el header `Authorization` al llamar a `/api/media`.
 */
export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const file = url.searchParams.get('file') ?? '';

  if (!isMediaKey(file)) {
    return json({ message: 'Medio no encontrado' }, 404);
  }

  const expiresAt = Date.now() + MEDIA_TOKEN_TTL_MS;
  const token = signToken(file, expiresAt);

  return json(
    { token, expiresAt, mediaKey: file, mime: MEDIA_REGISTRY[file].mime },
    200,
    {
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    },
  );
};

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}
