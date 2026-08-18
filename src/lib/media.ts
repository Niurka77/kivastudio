/**
 * Medios privados (video de bienvenida y foto de la artesana).
 *
 * Los archivos viven en `private-media/` (NUNCA en `public/`), se sirven
 * únicamente a través del Server Endpoint `/api/media` y solo a quien
 * presente un token firmado de corta duración emitido por `/api/media-token`.
 *
 * Esto no es infalible (todo lo que el navegador renderiza se puede capturar),
 * pero elimina la URL estática adivinable y las opciones de descarga triviales
 * (clic derecho, ver código fuente, etc.). Ver ADR B.5 / 02 §15.10.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import path from 'node:path';

export const MEDIA_REGISTRY = {
  'welcome-video': { file: 'welcome.mp4', mime: 'video/mp4' },
  artesana: { file: 'artesana.webp', mime: 'image/webp' },
} as const;

export type MediaKey = keyof typeof MEDIA_REGISTRY;

export function isMediaKey(value: string): value is MediaKey {
  return Object.prototype.hasOwnProperty.call(MEDIA_REGISTRY, value);
}

/** Validez del token: breve, para que un enlace copiado no sirva después. */
export const MEDIA_TOKEN_TTL_MS = 90_000;

const SECRET_ENV = 'PRIVATE_MEDIA_SECRET';

function secret(): string {
  const value = import.meta.env[SECRET_ENV] as string | undefined;
  if (value) return value;
  if (import.meta.env.PROD) {
    throw new Error(`Variable de entorno requerida no definida: ${SECRET_ENV}`);
  }
  return 'dev-only-secret-no-usar-en-produccion';
}

/** Ruta absoluta del archivo físico (relativa a la raíz del proyecto). */
export function mediaPath(mediaKey: MediaKey): string {
  return path.resolve(process.cwd(), 'private-media', MEDIA_REGISTRY[mediaKey].file);
}

export function signToken(file: string, expiresAt: number): string {
  const payload = `${file}.${expiresAt}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string, file: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenFile, rawExp, sig] = parts;
  if (tokenFile !== file) return false;

  const expiresAt = Number(rawExp);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = createHmac('sha256', secret())
    .update(`${tokenFile}.${rawExp}`)
    .digest('base64url');
  const actual = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  return actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf);
}
