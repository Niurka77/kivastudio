import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/server-auth';
import { sectionKeySchema, updateSectionSchema } from '@/schemas/section';
import type { SiteSection } from '@/types';

/**
 * Server endpoint de secciones de la portada.
 * - GET:  el público lee las activas; un admin autenticado ve todas.
 * - PATCH: actualiza el título/subtítulo/fondo de una sección (solo la dueña).
 */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

interface SectionRow {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  background_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: SectionRow): SiteSection {
  return {
    id: row.id,
    key: row.key as SiteSection['key'],
    title: row.title,
    subtitle: row.subtitle,
    backgroundUrl: row.background_url,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  const supabase = getSupabaseServiceClient();

  let query = supabase.from('sections').select('*');
  if (!admin) {
    query = query.eq('active', true);
  }
  const { data, error } = await query.order('key', { ascending: true });

  if (error) {
    return json({ message: error.message }, 500);
  }
  return json((data ?? []).map(mapRow));
};

export const PATCH: APIRoute = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (!admin) {
    return json({ message: 'No autorizado: se requiere iniciar sesión como admin' }, 401);
  }
  if (admin.role !== 'owner') {
    return json({ message: 'Solo la dueña puede editar las secciones de la página.' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Cuerpo de la petición inválido' }, 400);
  }

  const rawKey = (body as { key?: unknown })?.key;
  const keyParsed = sectionKeySchema.safeParse(rawKey);
  if (!keyParsed.success) {
    return json({ message: 'Falta o no es válida la sección (key)' }, 400);
  }

  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return json({ message }, 400);
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.title !== undefined) patch.title = d.title;
  if (d.subtitle !== undefined) patch.subtitle = d.subtitle;
  if (d.backgroundUrl !== undefined) patch.background_url = d.backgroundUrl;
  if (d.active !== undefined) patch.active = d.active;

  const { data, error } = await getSupabaseServiceClient()
    .from('sections')
    .update(patch)
    .eq('key', keyParsed.data)
    .select()
    .maybeSingle();
  if (error) {
    return json({ message: error.message }, 500);
  }
  if (!data) {
    return json({ message: 'Sección no encontrada' }, 404);
  }
  return json(mapRow(data));
};