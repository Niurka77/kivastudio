/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Dominio canónico del sitio (ver PUBLIC_SITE_URL en .env.example) */
  readonly PUBLIC_SITE_URL?: string;
  /** Key pública (anon) de Supabase */
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** Secret de servidor (solo Server Endpoints, nunca al navegador) */
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  /** WhatsApp de la marca (formato internacional) */
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
