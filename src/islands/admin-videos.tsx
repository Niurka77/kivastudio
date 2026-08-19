import { useRef, useState } from 'react';
import {
  Clapperboard,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Video as VideoIcon,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createVideo, deleteVideo, fetchVideos, updateVideo } from '@/lib/api/videos';
import { uploadImage } from '@/lib/api/products';
import { useAdminRole, ROLE_LABEL } from '@/lib/auth/admin-status';
import type { Video } from '@/types';

/**
 * Panel de videos de las creaciones: la hermana de videos (rol "videos") sube
 * los videos del proceso y resultado de las piezas. Se ven en la portada en la
 * sección "Videos de las creaciones".
 */

const EMPTY_FORM = { title: '', description: '', videoUrl: '', thumbnailUrl: '', active: true };

function VideoPreview({ url, kind }: { url: string; kind: 'video' | 'image' }) {
  if (!url) return null;
  return kind === 'video' ? (
    <video src={url} controls playsInline preload="metadata" className="h-24 w-24 rounded-md object-cover" />
  ) : (
    <img src={url} alt="Vista previa" className="h-24 w-24 rounded-md object-cover" />
  );
}

function AdminVideosInner() {
  const queryClient = useQueryClient();
  const role = useAdminRole();
  const canDelete = role === 'owner';

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: fetchVideos,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    void queryClient.invalidateQueries({ queryKey: ['videos'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        videoUrl: form.videoUrl,
        thumbnailUrl: form.thumbnailUrl || null,
        active: form.active,
      };
      return editingId ? updateVideo(editingId, payload) : createVideo(payload);
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateVideo(id, { active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: invalidate,
  });

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 'videos');
      setForm((f) => ({ ...f, videoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el video');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 'videos');
      setForm((f) => ({ ...f, thumbnailUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la portada');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const startEdit = (v: Video) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      description: v.description ?? '',
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl ?? '',
      active: v.active,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const videos = data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Videos de las creaciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sube el video del proceso o resultado de una pieza. Aparecerá en la
          portada, en la sección "Videos de las creaciones".
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim() || !form.videoUrl) return;
          setError(null);
          saveMutation.mutate();
        }}
        className="space-y-4 rounded-lg border border-border bg-background p-5 shadow-soft sm:p-6"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">
          {editingId ? 'Editar video' : 'Nuevo video'}
        </h2>

        {saveMutation.isSuccess && (
          <p className="rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
            {editingId ? 'Cambios guardados.' : 'Video publicado en la portada.'}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {saveMutation.isError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {saveMutation.error?.message ?? 'No se pudo guardar el video'}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="v-title">Título</Label>
          <Input
            id="v-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Amigurumi de lana natural"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-desc">Descripción (opcional)</Label>
          <Textarea
            id="v-desc"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Qué se ve en el video, materiales, proceso…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-video">Video</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <VideoPreview url={form.videoUrl} kind="video" />
            <Input
              id="v-video"
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://… o sube un archivo"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleUploadVideo}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2"
              disabled={uploadingVideo}
              onClick={() => videoInputRef.current?.click()}
            >
              {uploadingVideo ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <VideoIcon className="size-4" aria-hidden="true" />
              )}
              {uploadingVideo ? 'Subiendo…' : 'Subir video'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">MP4, WEBM o MOV · hasta 200 MB.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-cover">Portada (opcional)</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <VideoPreview url={form.thumbnailUrl} kind="image" />
            <Input
              id="v-cover"
              value={form.thumbnailUrl}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              placeholder="Imagen de portada antes de reproducir"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUploadCover}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploadingCover ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              {uploadingCover ? 'Subiendo…' : 'Subir portada'}
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
            disabled={saveMutation.isPending || !form.title.trim() || !form.videoUrl}
          >
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
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando videos…
        </p>
      ) : isError ? (
        <p className="py-10 text-destructive">
          {queryError instanceof Error ? queryError.message : 'No se pudieron cargar los videos'}
        </p>
      ) : videos.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          <Clapperboard className="size-8 text-primary-soft" aria-hidden="true" />
          Aún no hay videos. Sube el primero de una creación.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {videos.map((v) => (
            <li key={v.id} className="flex flex-col rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <VideoPreview url={v.thumbnailUrl ?? v.videoUrl} kind={v.thumbnailUrl ? 'image' : 'video'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{v.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        v.active
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {v.active ? 'Activo' : 'Oculto'}
                    </span>
                  </div>
                  {v.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ id: v.id, active: !v.active })}
                >
                  {v.active ? 'Ocultar' : 'Mostrar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(v)}>
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
                          `¿Eliminar "${v.title}"? Esta acción no se deshace.`,
                        )
                      )
                        return;
                      deleteMutation.mutate(v.id);
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
          Eres {ROLE_LABEL[role ?? 'editor']} · solo la dueña puede eliminar videos.
        </p>
      )}
    </div>
  );
}

export default function AdminVideos() {
  return (
    <QueryProvider>
      <AdminVideosInner />
    </QueryProvider>
  );
}