import { useEffect, useState } from 'react';
import { Clapperboard, LoaderCircle } from 'lucide-react';
import TypingTitle from '@/islands/TypingTitle';
import SectionDecor from '@/islands/SectionDecor';
import {
  sectionAlign,
  sectionAlignClass,
  sectionBgStyle,
  sectionSubtitle,
  sectionTextAlignStyle,
  sectionTitle,
} from '@/lib/sections';
import { fetchVideos } from '@/lib/api/videos';
import type { SiteSection, Video } from '@/types';

/**
 * Sección "Videos de las creaciones" de la portada.
 * Muestra en una grilla los videos publicados por la hermana encargada de
 * videos (roll "videos") desde el panel admin `/admin/videos`.
 * El título y el fondo (textura) son editables desde `/admin/secciones`.
 */
export default function VideosSection({ section }: { section?: SiteSection }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    void fetchVideos()
      .then((data) => {
        if (!cancelled) {
          setVideos(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bg = sectionBgStyle(section?.backgroundUrl);
  const align = sectionAlign(section);

  return (
    <section
      id="videos"
      aria-label="Videos de las creaciones"
      className={bg ? 'relative overflow-hidden' : 'relative overflow-hidden bg-secondary'}
      style={bg}
    >
      {bg && <div className="absolute inset-0 z-0 bg-background/60" aria-hidden="true" />}
      <SectionDecor left={section?.decorationLeft} right={section?.decorationRight} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className={sectionAlignClass(align)} style={sectionTextAlignStyle(align)}>
            <TypingTitle
              text={sectionTitle(section, 'Videos de las creaciones')}
              tag="h2"
              className="text-3xl sm:text-4xl"
            />
            <p className="mt-2 max-w-xl text-muted-foreground">
              {sectionSubtitle(
                section,
                'Mira el proceso y el resultado de nuestras piezas, grabado en casa.',
              )}
            </p>
          </div>
        </header>

        {status === 'loading' && (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Cargando videos…
          </div>
        )}

        {status === 'error' && (
          <p className="mt-10 text-center text-muted-foreground">
            No se pudieron cargar los videos en este momento.
          </p>
        )}

        {status === 'ready' && videos.length === 0 && (
          <div className="mt-10 rounded-[20px] border border-dashed border-border p-10 text-center">
            <Clapperboard className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 font-semibold text-foreground">Pronto subiremos videos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estamos grabando el proceso de nuestras piezas.
            </p>
          </div>
        )}

        {status === 'ready' && videos.length > 0 && (
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <li key={video.id} className="flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-background">
                <div className="aspect-video w-full bg-secondary">
                  <video
                    src={video.videoUrl}
                    poster={video.thumbnailUrl ?? undefined}
                    controls
                    preload="metadata"
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h3 className="font-heading font-bold text-foreground">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}