import type { APIRoute } from 'astro';

/**
 * robots.txt (SEO): permite indexar todo y señala el sitemap.
 * El panel admin no se enlaza desde aquí y no debe indexarse.
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const site = (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://kivastudio.vercel.app';
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};