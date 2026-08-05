import { useRef, useState } from 'react';
import {
  Clapperboard,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPost, deletePost, fetchPosts, updatePost } from '@/lib/api/posts';
import { uploadImage } from '@/lib/api/products';
import { useAdminRole, ROLE_LABEL } from '@/lib/auth/admin-status';
import type { Post } from '@/types';

/**
 * Panel de publicaciones "día a día": la dueña sube fotos/videos del avance de
 * cada pedido, con un título y descripción. Lo activo se ve en la tienda.
 */

const EMPTY_FORM = { title: '', body: '', mediaUrl: '', mediaType: 'image', active: true };

function detectMediaType(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

function MediaPreview({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: string }) {
  if (!mediaUrl) return null;
  return mediaType === 'video' ? (
    <video src={mediaUrl} controls playsInline preload="metadata" className="h-24 w-24 rounded-md object-cover" />
  ) : (
    <img src={mediaUrl} alt="Vista previa" className="h-24 w-24 rounded-md object-cover" />
  );
}

function AdminPostsInner() {
  const queryClient = useQueryClient();
  const role = useAdminRole();
  const canDelete = role === 'owner';

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: fetchPosts,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title || null,
        body: form.body || null,
        mediaUrl: form.mediaUrl,
        mediaType: form.mediaType as 'image' | 'video',
        active: form.active,
      };
      return editingId ? updatePost(editingId, payload) : createPost(payload);
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePost(id, { active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: invalidate,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 'posts');
      setForm((f) => ({
        ...f,
        mediaUrl: url,
        mediaType: detectMediaType(file),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setForm({
      title: p.title ?? '',
      body: p.body ?? '',
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      active: p.active,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const posts = data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Novedades / Día a día
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sube la foto o el video del avance de cada pedido. Aparecerá en la
          sección "Sigue el día a día" de la tienda.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.mediaUrl) return;
          setError(null);
          saveMutation.mutate();
        }}
        className="space-y-4 rounded-lg border border-border bg-background p-5 shadow-soft sm:p-6"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">
          {editingId ? 'Editar publicación' : 'Nueva publicación'}
        </h2>

        {saveMutation.isSuccess && (
          <p className="rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
            {editingId ? 'Cambios guardados.' : 'Publicado en la tienda.'}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {saveMutation.isError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {saveMutation.error?.message ?? 'No se pudo guardar la publicación'}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="p-media">Foto o video del avance</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <MediaPreview mediaUrl={form.mediaUrl} mediaType={form.mediaType} />
            <Input
              id="p-media"
              value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
              placeholder="https://… o sube un archivo"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime"
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
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              {uploading ? 'Subiendo…' : 'Subir'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Imágenes hasta 5 MB · videos hasta 50 MB.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-title">Título (opcional)</Label>
          <Input
            id="p-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Amigurumi a medio tejer"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-body">Descripción (opcional)</Label>
          <Textarea
            id="p-body"
            rows={2}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Así va avanzando tu pedido, punto a punto…"
          />
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
          <Button type="submit" className="gap-2" disabled={saveMutation.isPending || !form.mediaUrl}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : editingId ? (
              <Save className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {editingId ? 'Guardar cambios' : 'Publicar'}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando publicaciones…
        </p>
      ) : isError ? (
        <p className="py-10 text-destructive">
          {queryError instanceof Error ? queryError.message : 'No se pudieron cargar las publicaciones'}
        </p>
      ) : posts.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          <Clapperboard className="size-8 text-primary-soft" aria-hidden="true" />
          Aún no hay publicaciones. Sube la primera foto o video del avance.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-col rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <MediaPreview mediaUrl={p.mediaUrl} mediaType={p.mediaType} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.title && (
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.active
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.active ? 'Activa' : 'Oculta'}
                    </span>
                  </div>
                  {p.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })}
                >
                  {p.active ? 'Ocultar' : 'Mostrar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(p)}>
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          p.title
                            ? `¿Eliminar "${p.title}"? Esta acción no se deshace.`
                            : '¿Eliminar esta publicación? Esta acción no se deshace.',
                        )
                      )
                        return;
                      deleteMutation.mutate(p.id);
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
          Eres {ROLE_LABEL[role ?? 'editor']} · solo la dueña puede eliminar publicaciones.
        </p>
      )}
    </div>
  );
}

export default function AdminPosts() {
  return (
    <QueryProvider>
      <AdminPostsInner />
    </QueryProvider>
  );
}