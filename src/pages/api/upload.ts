import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';

/**
 * Server Endpoint de subida de imágenes (solo servidor, service role).
 * Recibe un archivo vía multipart/form-data (campo "file"), valida tipo y
 * tamaño, lo sube al bucket público "product-images" y devuelve su URL pública.
 * Las escrituras a Storage no se abren al anónimo (ver migración 0002).
 */
export const prerender = false;

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado: se requiere iniciar sesión como admin' }, 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ message: 'Formulario inválido' }, 400);
  }

  const file = form.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return json({ message: 'No se envió ningún archivo' }, 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({ message: 'Formato no permitido (usa PNG, JPG, WEBP o SVG)' }, 400);
  }
  if (file.size > MAX_SIZE) {
    return json({ message: 'La imagen supera los 5 MB' }, 400);
  }

  const ext = extensionFor(file.type);
  const path = `products/${randomUUID()}.${ext}`;
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    return json({ message: `No se pudo subir la imagen: ${error.message}`, error }, 500);
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return json({ url: data.publicUrl }, 201);
};

function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
