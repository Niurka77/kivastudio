import { useEffect, useRef, useState } from 'react';
import { CircleAlert, LoaderCircle, Pause, Play } from 'lucide-react';
import TypingTitle from '@/islands/TypingTitle';
import { cn } from '@/lib/utils';
import { useProtectedMedia } from '@/lib/useProtectedMedia';
import {
  hasSectionBg,
  sectionBgStyle,
  sectionSubtitle,
  sectionTitle,
} from '@/lib/sections';
import type { SiteSection } from '@/types';

/**
 * Sección de bienvenida de la página de inicio.
 *
 * Reproduce el video de bienvenida hecho por la artesana que está detrás de
 * Kiva Studio. El video es privado: se sirve vía `/api/media` con token firmado
 * y se carga como Blob (URL `blob:`), sin botón de descarga en los controles,
 * sin Picture-in-Picture y bloqueando el menú contextual del reproductor.
 */
export default function WelcomeVideo({ section }: { section?: SiteSection }) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);

  const { url, status, reload } = useProtectedMedia('welcome-video', {
    enabled: inView,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const ready = status === 'ready' && url !== null;
  const bg = hasSectionBg(section?.backgroundUrl);

  return (
    <section
      ref={containerRef}
      id="bienvenida"
      aria-label="Video de bienvenida de Kiva Studio"
      className={cn('bg-background', bg && 'relative')}
      style={sectionBgStyle(section?.backgroundUrl)}
    >
      {bg && <div className="absolute inset-0 bg-background/60" aria-hidden="true" />}
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-sm font-semibold text-primary-strong">
            Conócenos · Bienvenida
          </span>
          <TypingTitle
            text={sectionTitle(section, 'Te damos la bienvenida')}
            tag="h2"
            className="mt-5 text-3xl sm:text-4xl"
          />
          <p className="mt-4 text-lg text-muted-foreground">
            {sectionSubtitle(
              section,
              'La artesana detrás de Kiva Studio es un poco penosa, así que en vez de hablar mucho, te deja este video de bienvenida tejido con el corazón.',
            )}
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] bg-secondary shadow-soft-lg">
            <div className="aspect-video">
              {/* Sin archivo de subtítulos disponible; la regla de accesibilidad no aplica. */}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                src={ready ? url : undefined}
                className={cn(
                  'h-full w-full object-cover',
                  ready ? 'opacity-100' : 'opacity-0',
                )}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                playsInline
                preload="none"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
            </div>

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <LoaderCircle
                  className="size-10 animate-spin text-primary"
                  aria-hidden="true"
                />
                <span className="sr-only">Cargando video…</span>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary px-6 text-center">
                <CircleAlert className="size-8 text-primary-strong" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar el video. Inténtalo de nuevo.
                </p>
                <button
                  type="button"
                  onClick={reload}
                  className="rounded-[16px] bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Reintentar
                </button>
              </div>
            )}

            {ready && !playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Reproducir video de bienvenida"
                className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
              >
                <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-primary shadow-soft transition-transform group-hover:scale-105 group-active:scale-95">
                  <Play
                    className="size-8 translate-x-0.5 fill-current"
                    aria-hidden="true"
                  />
                </span>
              </button>
            )}

            {ready && playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Pausar video"
                className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/85 text-primary opacity-0 shadow-soft transition-opacity hover:opacity-100 focus-visible:opacity-100"
              >
                <Pause className="size-5 fill-current" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
