import { useRef, useState } from 'react';
import {
  ImageUp,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { deleteReview, fetchReviews, updateReview } from '@/lib/api/reviews';
import { createReview } from '@/lib/api/reviews';
import { uploadImage } from '@/lib/api/products';
import { useAdminRole, ROLE_LABEL } from '@/lib/auth/admin-status';
import type { Review } from '@/types';

/**
 * Panel de reseñas: crear (desde cero, con foto, para clientes que ya
 * compraron), editar, activar/ocultar y eliminar (solo la dueña).
 */

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} de 5 estrellas`}
          onClick={() => onChange(n)}
          className="cursor-pointer"
        >
          <Star
            className={`size-5 ${
              n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  name: '',
  detail: '',
  review: '',
  rating: 5,
  imageUrl: '',
  active: true,
};

function AdminReviewsInner() {
  const queryClient = useQueryClient();
  const role = useAdminRole();
  const canDelete = role === 'owner';

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: fetchReviews,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    void queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        detail: form.detail || null,
        review: form.review,
        rating: form.rating,
        imageUrl: form.imageUrl || null,
      };
      return editingId
        ? updateReview(editingId, payload)
        : createReview(payload);
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateReview(id, { active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: invalidate,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      detail: r.detail ?? '',
      review: r.review,
      rating: r.rating,
      imageUrl: r.imageUrl ?? '',
      active: r.active,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reviews = data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Reseñas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea reseñas para clientes que ya compraron, edítalas o ocúltalas. Lo
          que esté activo se ve en la tienda.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.name.trim().length < 2 || form.review.trim().length < 10) return;
          setError(null);
          saveMutation.mutate();
        }}
        className="space-y-4 rounded-lg border border-border bg-background p-5 shadow-soft sm:p-6"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">
          {editingId ? 'Editar reseña' : 'Nueva reseña'}
        </h2>

        {saveMutation.isSuccess && (
          <p className="rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
            {editingId ? 'Cambios guardados.' : 'Reseña publicada en la tienda.'}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {saveMutation.isError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {saveMutation.error?.message ?? 'No se pudo guardar la reseña'}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rv-name">Nombre del cliente</Label>
            <Input
              id="rv-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="María Fernández"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-detail">¿Qué pidió? (opcional)</Label>
            <Input
              id="rv-detail"
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              placeholder="Amigurumi personalizado"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Calificación</Label>
          <Stars value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rv-review">Reseña</Label>
          <Textarea
            id="rv-review"
            rows={3}
            value={form.review}
            onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
            placeholder="Lo que recibió quedó precioso y muy bien hecho…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rv-image">Foto del cliente (opcional)</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Foto del cliente"
                className="h-14 w-14 rounded-full object-cover"
              />
            )}
            <Input
              id="rv-image"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://… o sube una foto"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImageUp className="size-4" aria-hidden="true" />
              )}
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="size-4 accent-primary"
          />
          Activa (visible en la tienda)
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Cancelar edición
            </Button>
          )}
          <Button
            type="submit"
            className="gap-2"
            disabled={
              saveMutation.isPending ||
              form.name.trim().length < 2 ||
              form.review.trim().length < 10
            }
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : editingId ? (
              <Save className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {editingId ? 'Guardar cambios' : 'Crear reseña'}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando reseñas…
        </p>
      ) : isError ? (
        <p className="py-10 text-destructive">
          {queryError instanceof Error ? queryError.message : 'No se pudieron cargar las reseñas'}
        </p>
      ) : reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Aún no hay reseñas. Crea la primera para clientes que ya compraron.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
            >
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={`Foto de ${r.name}`}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft/40 font-heading font-bold text-primary-strong">
                  {r.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.active
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r.active ? 'Activa' : 'Oculta'}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < r.rating
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  “{r.review}”
                </p>
                {r.detail && (
                  <p className="text-xs text-muted-foreground/70">{r.detail}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
                >
                  {r.active ? 'Ocultar' : 'Mostrar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(r)}>
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(`¿Eliminar la reseña de ${r.name}? Esta acción no se deshace.`)
                      )
                        return;
                      deleteMutation.mutate(r.id);
                    }}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    )}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!canDelete && (
        <p className="text-xs text-muted-foreground">
          Eres {ROLE_LABEL[role ?? 'editor']} · solo la dueña puede eliminar reseñas.
        </p>
      )}
    </div>
  );
}

export default function AdminReviews() {
  return (
    <QueryProvider>
      <AdminReviewsInner />
    </QueryProvider>
  );
}