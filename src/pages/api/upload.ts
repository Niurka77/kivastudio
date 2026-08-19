import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { adminCan, getAdminUser } from '@/lib/auth/server-auth';

/**
 * Server Endpoint de subida de medios (solo servidor, service role).
 * Recibe multipart/form-data: campo "file" y opcional "folder".
 * - products: imágenes, bucket "product-images" (5 MB) — rol products/dueña.
 * - posts:    imágenes o videos, bucket "posts" (50 MB) — rol trends/dueña.
 * - videos:   videos, bucket "videos" (200 MB) — rol videos/dueña.
 * - sections: texturas/fondos de sección, bucket "product-images" (5 MB) — dueña.
 * Las escrituras a Storage no se abren al anónimo (ver migraciones 0002/0004/0005).
 */
export const prerender = false;

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const FOLDERS: Record<
  'products' | 'posts' | 'videos' | 'sections',
  { bucket: string; path: string; allowed: string[]; maxSize: number; roles: ('products' | 'trends' | 'videos' | 'editor')[] }
> = {
  products: {
    bucket: 'product-images',
    path: 'products',
    allowed: IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024,
    roles: ['products', 'editor'],
  },
  posts: {
    bucket: 'posts',
    path: 'posts',
    allowed: [...IMAGE_TYPES, ...VIDEO_TYPES],
    maxSize: 50 * 1024 * 1024,
    roles: ['trends', 'editor'],
  },
  videos: {
    bucket: 'videos',
    path: 'videos',
    allowed: [...VIDEO_TYPES, ...IMAGE_TYPES],
    maxSize: 200 * 1024 * 1024,
    roles: ['videos', 'editor'],
  },
  sections: {
    bucket: 'product-images',
    path: 'sections',
    allowed: IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024,
    roles: [],
  },
};

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

  const rawFolder = (form.get('folder') as string | null) ?? 'products';
  const folderKey = (rawFolder in FOLDERS ? rawFolder : 'products') as keyof typeof FOLDERS;
  const folder = FOLDERS[folderKey];

  // Las texturas de sección solo las sube la dueña.
  if (folderKey === 'sections' && admin.role !== 'owner') {
    return json({ message: 'Solo la dueña puede subir fondos de sección.' }, 403);
  }
  if (!adminCan(admin, ...folder.roles)) {
    return json({ message: 'No autorizado para subir archivos en esta carpeta.' }, 403);
  }

  if (!folder.allowed.includes(file.type)) {
    return json(
      {
        message: `Formato no permitido (usa ${
          folderKey === 'posts'
            ? 'PNG, JPG, WEBP, SVG, MP4 o WEBM'
            : folderKey === 'videos'
              ? 'MP4, WEBM, MOV o imagen de portada (PNG/JPG/WEBP)'
              : 'PNG, JPG, WEBP o SVG'
        })`,
      },
      400,
    );
  }
  if (file.size > folder.maxSize) {
    const mb = Math.round(folder.maxSize / (1024 * 1024));
    return json({ message: `El archivo supera los ${mb} MB` }, 400);
  }

  const ext = extensionFor(file.type);
  const path = `${folder.path}/${randomUUID()}.${ext}`;
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage
    .from(folder.bucket)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    return json({ message: `No se pudo subir el archivo: ${error.message}`, error }, 500);
  }

  const { data } = supabase.storage.from(folder.bucket).getPublicUrl(path);
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
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/quicktime':
      return 'mov';
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