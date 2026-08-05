/**
 * Acceso tipado y seguro a las variables de entorno públicas.
 *
 * Solo se expone lo estrictamente necesario a la UI (prefijo `PUBLIC_`).
 * Los secretos de Supabase (service role) se leen únicamente en entornos
 * de servidor y NUNCA se exponen al cliente.
 * Ver 02_PROJECT_ARCHITECTURE.md §15.10 y ADR B.5.
 */

export const env = {
  siteUrl: import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  whatsappNumber: import.meta.env.PUBLIC_WHATSAPP_NUMBER,
  adminEmails: import.meta.env.PUBLIC_ADMIN_EMAILS ?? '',
} as const;

export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    // En producción el fallo es intencional: no arranca sin configuración.
    if (import.meta.env.PROD) {
      throw new Error(`Variable de entorno requerida no definida: ${name}`);
    }
    return '';
  }
  return value;
}
