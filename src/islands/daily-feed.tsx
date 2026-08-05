import { Calendar, Clapperboard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { InstagramIcon } from '@/components/brand-icons';
import { fetchPosts } from '@/lib/api/posts';
import type { Post } from '@/types';

/**
 * Sección "Sigue el día a día": muestra las fotos/videos que la dueña sube
 * desde el panel admin con el avance de cada pedido (en vez de placeholders).
 */

const INSTAGRAM_URL = 'https://www.instagram.com/kiva_studio.pe/';
const INSTAGRAM_HANDLE = '@kiva_studio.pe';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function PostCard({ post }: { post: Post }) {
  return (
    <li className="overflow-hidden rounded-[20px] border border-border bg-background shadow-soft">
      {post.mediaType === 'video' ? (
        <video
          src={post.mediaUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-square w-full bg-black object-cover"
        />
      ) : (
        <img
          src={post.mediaUrl}
          alt={post.title ?? 'Avance de pedido'}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" aria-hidden="true" />
          {formatDate(post.createdAt)}
        </div>
        {post.title && (
          <p className="mt-2 font-heading text-base font-bold text-foreground">
            {post.title}
          </p>
        )}
        {post.body && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {post.body}
          </p>
        )}
      </div>
    </li>
  );
}

function DailyFeedContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const posts = data ?? [];

  return (
    <div>
      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-[20px] border border-border bg-background"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-8 rounded-[20px] border border-border px-6 py-10 text-center text-muted-foreground">
          {error instanceof Error ? error.message : 'No se pudieron cargar las novedades'}
        </p>
      ) : posts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[24px] border border-dashed border-border bg-secondary px-6 py-14 text-center">
          <Clapperboard className="size-10 text-primary-soft" aria-hidden="true" />
          <p className="mt-4 max-w-md font-heading text-lg font-bold text-foreground">
            Muy pronto: el avance real de cada pedido
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Aquí verás la foto o el video del proceso de tus pedidos favoritos,
            desde el primer punto hasta la pieza terminada.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-[16px] border border-border bg-background px-5 py-2.5 text-sm font-semibold text-primary-strong transition-colors hover:bg-secondary"
          >
            <InstagramIcon className="size-4" aria-hidden="true" />
            {INSTAGRAM_HANDLE}
          </a>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DailyFeed() {
  return (
    <QueryProvider>
      <DailyFeedContent />
    </QueryProvider>
  );
}