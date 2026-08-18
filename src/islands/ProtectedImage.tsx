import { cn } from '@/lib/utils';
import { useProtectedMedia } from '@/lib/useProtectedMedia';

interface ProtectedImageProps {
  /** Clave del medio en el registro de `src/lib/media.ts`. */
  mediaKey: string;
  alt: string;
  width?: number;
  height?: number;
  /** Clases aplicadas al contenedor (redondeo, sombra, ancho máximo…). */
  containerClassName?: string;
  /** Clases aplicadas a la <img> (fit, animación…). */
  imgClassName?: string;
}

/**
 * Imagen privada servida vía `/api/media` con token firmado y cargada como
 * Blob. La URL real nunca está en el DOM ni en el código fuente, y se bloquean
 * el menú contextual y el arrastre (anti "clic derecho → guardar como").
 */
export default function ProtectedImage({
  mediaKey,
  alt,
  width,
  height,
  containerClassName,
  imgClassName,
}: ProtectedImageProps) {
  const { url, status } = useProtectedMedia(mediaKey);

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          width={width}
          height={height}
          draggable={false}
          className={cn(
            'h-full w-full object-cover animate-in fade-in-0 slide-in-from-bottom-3 duration-700',
            imgClassName,
          )}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 bg-muted',
            status === 'loading' && 'animate-pulse',
          )}
        />
      )}
    </div>
  );
}
