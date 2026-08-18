// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// El dominio canónico se resuelve en build; en local se usa el fallback.
const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  // Static por defecto (SSG, SEO-first). Las páginas/endpoints que necesiten
  // renderizado en servidor (panel admin, operaciones sensibles) optan
  // con `export const prerender = false`. Ver 02 §7.12 y ADR C.2.
  adapter: vercel({
    imageService: true,
    webAnalytics: { enabled: false },
    // Los medios privados (video de bienvenida y foto de la artesana) se sirven
    // vía /api/media; se incluyen en el bundle del Serverless Function.
    includeFiles: ['private-media/welcome.mp4', 'private-media/artesana.webp'],
  }),
  image: {
    // Formatos modernos con fallback: AVIF/WebP (ver 02_PROJECT_ARCHITECTURE.md §16.3)
    service: { entrypoint: 'astro/assets' },
  },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
