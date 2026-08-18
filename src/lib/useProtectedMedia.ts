import { useEffect, useState } from 'react';

export type ProtectedMediaStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseProtectedMediaOptions {
  /** Si es false, no inicia la descarga hasta que cambie a true (lazy load). */
  enabled?: boolean;
}

interface UseProtectedMediaResult {
  url: string | null;
  status: ProtectedMediaStatus;
  reload: () => void;
}

/**
 * Carga un medio privado (video/foto) solicitando primero un token firmado de
 * corta duración y después descargándolo como Blob. El resultado es una URL
 * `blob:` que se revoca al desmontar el componente, de modo que la URL real del
 * archivo nunca aparece en el DOM ni en el código fuente de la página.
 */
export function useProtectedMedia(
  mediaKey: string,
  { enabled = true }: UseProtectedMediaOptions = {},
): UseProtectedMediaResult {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProtectedMediaStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load(): Promise<void> {
      setStatus('loading');
      try {
        const tokenResponse = await fetch(
          `/api/media-token?file=${encodeURIComponent(mediaKey)}`,
        );
        if (!tokenResponse.ok) throw new Error('No se pudo obtener acceso al medio');

        const { token } = (await tokenResponse.json()) as { token?: string };
        if (!token) throw new Error('Respuesta de token inválida');

        const mediaResponse = await fetch(
          `/api/media?file=${encodeURIComponent(mediaKey)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!mediaResponse.ok) throw new Error('No se pudo descargar el medio');

        const blob = await mediaResponse.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaKey, attempt, enabled]);

  return {
    url,
    status,
    reload: () => setAttempt((n) => n + 1),
  };
}
