import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchSections, updateSection } from '@/lib/api/sections';
import { uploadImage } from '@/lib/api/products';
import { useAdminRole } from '@/lib/auth/admin-status';
import { SECTION_LABELS } from '@/lib/sections';
import type { SectionKey } from '@/types';

/**
 * Panel de secciones de la portada (solo la dueña).
 * Permite editar, sin tocar código, el título y el fondo (textura/imagen) de
 * cada sección de la página de inicio, y mostrar u ocultar secciones.
 */

function AdminSectionsInner() {
  const queryClient = useQueryClient();
  const role = useAdminRole();
  const isOwner = role === 'owner';

  const [selectedKey, setSelectedKey] = useState<SectionKey>('hero');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sections'],
    queryFn: fetchSections,
  });

  const sections = data ?? [];

  const select = (key: SectionKey) => {
    const found = sections.find((s) => s.key === key);
    setSelectedKey(key);
    setTitle(found?.title ?? '');
    setSubtitle(found?.subtitle ?? '');
    setBackgroundUrl(found?.backgroundUrl ?? '');
    setActive(found?.active ?? true);
    setError(null);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSection(selectedKey, {
        title: title || null,
        subtitle: subtitle || null,
        backgroundUrl: backgroundUrl || null,
        active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      void queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 'sections');
      setBackgroundUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la textura');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeBackground = () => {
    setBackgroundUrl('');
    setError(null);
  };

  if (!isOwner) {
    return (
      <div className="space-y-8">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Secciones de la portada
        </h1>
        <p className="rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive">
          Solo la dueña (Kaili) puede editar las secciones de la página. Si crees
          que deberías tener acceso, pídeselo a ella.
        </p>
      </div>
    );
  }

  const selected = sections.find((s) => s.key === selectedKey);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Secciones de la portada
        </h1>
        <p className="mt-2 text-muted-foreground">
          Cambia el título y el fondo (textura) de cada sección sin tocar código.
          Elige una sección, edita y guarda.
        </p>
      </header>

      {isLoading ? (
        <p className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando secciones…
        </p>
      ) : (
        <>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Seleccionar sección"
          >
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selectedKey === key}
                onClick={() => select(key)}
                className={[
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  selectedKey === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary-strong',
                ].join(' ')}
              >
                {SECTION_LABELS[key]}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              saveMutation.mutate();
            }}
            className="space-y-4 rounded-lg border border-border bg-background p-5 shadow-soft sm:p-6"
          >
            <h2 className="font-heading text-lg font-bold text-foreground">
              {SECTION_LABELS[selectedKey]}
            </h2>

            {saveMutation.isSuccess && (
              <p className="rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
                Sección actualizada en la portada.
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            {saveMutation.isError && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {saveMutation.error?.message ?? 'No se pudo guardar la sección'}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="s-title">Título</Label>
              <Input
                id="s-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título que se muestra en la portada"
              />
              <p className="text-xs text-muted-foreground">
                Déjalo vacío para usar el texto original de la página.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-subtitle">Subtítulo</Label>
              <Textarea
                id="s-subtitle"
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Texto corto debajo del título (opcional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-bg">Fondo / textura</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {backgroundUrl ? (
                  <img
                    src={backgroundUrl}
                    alt="Fondo de la sección"
                    className="h-16 w-24 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    Sin fondo
                  </div>
                )}
                <Input
                  id="s-bg"
                  value={backgroundUrl}
                  onChange={(e) => setBackgroundUrl(e.target.value)}
                  placeholder="https://… o sube una imagen"
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
                    <ImagePlus className="size-4" aria-hidden="true" />
                  )}
                  {uploading ? 'Subiendo…' : 'Subir'}
                </Button>
                {backgroundUrl && (
                  <Button type="button" variant="ghost" onClick={removeBackground}>
                    Quitar fondo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Textura o imagen que se muestra detrás de la sección · hasta 5 MB.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-primary"
              />
              Sección activa (visible en la portada)
            </label>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                className="gap-2"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            {selected && !selected.title && !selected.subtitle && !selected.backgroundUrl
              ? 'Esta sección todavía usa el texto y el fondo originales de la página.'
              : 'Consejo: sube texturas suaves para que el texto se siga leyendo bien.'}
          </p>
        </>
      )}
    </div>
  );
}

export default function AdminSections() {
  return (
    <QueryProvider>
      <AdminSectionsInner />
    </QueryProvider>
  );
}