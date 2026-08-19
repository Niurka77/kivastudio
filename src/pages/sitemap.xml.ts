import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Sitemap XML (SEO).
 * Lista la portada y las páginas propias de cada producto activo. Las rutas del
 * panel admin no se indexan (ver robots.txt). El sitemap se genera al vuelo
 * para reflejar siempre el catálogo actual.
 */
export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8' };

function xml(body: string): Response {
  return new Response(body, { status: 200, headers: JSON_HEADERS });
}

export const GET: APIRoute = async () => {
  const site = (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://kivastudio.vercel.app';

  const { data } = await getSupabaseServiceClient()
    .from('products')
    .select('slug, updated_at')
    .eq('active', true);

  const products = data ?? [];

  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${site}/`, lastmod: new Date().toISOString().slice(0, 10), priority: '1.0' },
    { loc: `${site}/#productos`, priority: '0.9' },
    { loc: `${site}/#nosotros`, priority: '0.7' },
    { loc: `${site}/#preguntas`, priority: '0.6' },
    { loc: `${site}/#contacto`, priority: '0.7' },
    ...products.map((p) => ({
      loc: `${site}/productos/${p.slug}`,
      lastmod: p.updated_at ? String(p.updated_at).slice(0, 10) : undefined,
      priority: '0.8',
    })),
  ];

  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${
          u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
        }\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n');

  return xml(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`,
  );
};