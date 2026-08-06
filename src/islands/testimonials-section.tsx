import { useState } from 'react';
import { Loader2, Send, Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createReview, fetchReviews } from '@/lib/api/reviews';
import type { Review } from '@/types';

/**
 * Sección de testimonios de la tienda.
 * - Muestra las reseñas reales guardadas en Supabase (solo activas).
 * - Mientras no haya reseñas propias, muestra testimonios de ejemplo
 *   (EXAMPLE_REVIEWS). En cuanto la dueña publique las primeras reseñas
 *   reales desde el panel, los ejemplos desaparecen automáticamente.
 * - Incluye un formulario para que cualquier cliente deje su reseña.
 * Las reseñas con foto las crea la dueña desde el panel (para quienes ya
 * compraron antes); el formulario público es solo texto.
 */

const EXAMPLE_REVIEWS: Review[] = [
  {
    id: 'ejemplo-1',
    name: 'María F.',
    detail: 'Amigurumi personalizado',
    review:
      'El amigurumi que encargué quedó idéntico a la foto y llegó a tiempo. Se nota el cariño en cada puntada.',
    rating: 5,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ejemplo-2',
    name: 'Carolina R.',
    detail: 'Bolso tejido',
    review:
      'Compré un bolso tejido para regalar y se enamoraron. Calidad y atención impecables, todo por WhatsApp.',
    rating: 5,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ejemplo-3',
    name: 'Lucía M.',
    detail: 'Muñeco bajo pedido',
    review:
      'Pude pedir colores y detalles a medida para el cumpleaños de mi hija. Quedó precioso y muy personal.',
    rating: 5,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function Stars({ value, interactive, onChange }: {
  value: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`${n} de 5 estrellas`}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`size-4 ${
              n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <li className="flex flex-col rounded-[20px] border border-border bg-background p-6 shadow-soft">
      {review.imageUrl && (
        <img
          src={review.imageUrl}
          alt={`Foto de ${review.name}`}
          loading="lazy"
          className="mb-4 h-20 w-20 rounded-full object-cover ring-4 ring-primary-soft/40"
        />
      )}
      <Stars value={review.rating} />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
        “{review.review}”
      </blockquote>
      <footer className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground">{review.name}</p>
        {review.detail && (
          <p className="text-xs text-muted-foreground">{review.detail}</p>
        )}
      </footer>
    </li>
  );
}

function TestimonialsContent() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviews,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createReview({ name, detail: detail || null, review, rating }),
    onSuccess: () => {
      setSent(true);
      setName('');
      setDetail('');
      setReview('');
      setRating(5);
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || review.trim().length < 10) return;
    mutation.mutate();
  };

  const reviews = data ?? [];

  return (
    <div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-56 animate-pulse rounded-[20px] border border-border bg-background"
              />
            ))
          : isError
            ? (
              <li className="col-span-full rounded-[20px] border border-border px-6 py-10 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">
                {error instanceof Error ? error.message : 'No se pudieron cargar las reseñas'}
              </li>
            )
            : reviews.length === 0
              ? EXAMPLE_REVIEWS.map((r) => <ReviewCard key={r.id} review={r} />)
              : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-12 max-w-2xl rounded-[24px] border border-border bg-background p-6 shadow-soft sm:p-8"
      >
        <h3 className="font-heading text-2xl font-bold text-foreground">
          ¿Compraste en Kiva Studio?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuéntanos cómo te fue, nos ayuda muchísimo.
        </p>

        {sent && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
            <Send className="size-4" aria-hidden="true" />
            ¡Gracias! Tu reseña ya aparece en la tienda.
          </p>
        )}
        {mutation.isError && (
          <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {mutation.error?.message ?? 'No se pudo guardar tu reseña'}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rv-name">Tu nombre</Label>
              <Input
                id="rv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="María"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rv-detail">¿Qué pediste? (opcional)</Label>
              <Input
                id="rv-detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Amigurumi personalizado"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tu calificación</Label>
            <Stars value={rating} interactive onChange={setRating} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-review">Tu reseña</Label>
            <Textarea
              id="rv-review"
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Lo que recibí quedó precioso y muy bien hecho…"
            />
            {review.trim().length > 0 && review.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Escribe al menos 10 caracteres.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="gap-2"
            disabled={
              mutation.isPending ||
              name.trim().length < 2 ||
              review.trim().length < 10
            }
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {mutation.isPending ? 'Enviando…' : 'Publicar reseña'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <QueryProvider>
      <TestimonialsContent />
    </QueryProvider>
  );
}