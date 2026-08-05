import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ImageUp, Loader2, Plus, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES } from '@/lib/categories';
import { createProduct, updateProduct, uploadImage } from '@/lib/api/products';
import type { CreateProductInput, Product } from '@/types';

/**
 * Formulario de producto (panel admin), usado tanto para crear como para editar.
 * - React Hook Form + Zod (ADR A.5): validación en runtime coherente con tipos.
 * - Sin `product` → POST a /api/products (crear).
 * - Con `product` → PATCH a /api/products/:id con valores precargados (editar).
 * - Refresca la caché del catálogo y del listado admin (TanStack Query).
 */
const productFormSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  description: z.string().nullable().optional(),
  price: z.number({ message: 'Ingresa un precio' }).positive('Debe ser mayor a 0'),
  availability: z.enum(['in_stock', 'made_to_order']),
  leadTime: z.number().int().min(1).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  galleryText: z.string().optional(),
  active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildDefaultValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: '',
      slug: '',
      description: '',
      price: 0,
      availability: 'in_stock',
      leadTime: undefined,
      categoryId: '',
      imageUrl: '',
      galleryText: '',
      active: true,
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: product.price,
    availability: product.availability,
    leadTime: product.leadTime ?? undefined,
    categoryId: product.categoryId ?? '',
    imageUrl: product.imageUrl ?? '',
    galleryText: (product.gallery ?? []).join(', '),
    active: product.active,
  };
}

interface Props {
  product?: Product;
  onCancel?: () => void;
}

export default function ProductForm(props: Props) {
  return (
    <QueryProvider>
      <ProductFormInner {...props} />
    </QueryProvider>
  );
}

function ProductFormInner({ product, onCancel }: Props) {
  const isEdit = product != null;
  const queryClient = useQueryClient();
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaultValues(product),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadImage(file);
      setValue('imageUrl', url);
      const current = getValues('galleryText') ?? '';
      setValue('galleryText', current ? `${current}, ${url}` : url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const availability = watch('availability');

  const mutation = useMutation({
    mutationFn: (input: CreateProductInput & { active: boolean }) =>
      isEdit ? updateProduct(product!.id, input) : createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (isEdit) {
        void queryClient.invalidateQueries({ queryKey: ['product', product!.id] });
      }
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    const gallery = (values.galleryText ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    mutation.mutate(
      {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        price: values.price,
        currency: 'PEN',
        availability: values.availability,
        leadTime: values.leadTime ?? null,
        categoryId: values.categoryId || null,
        imageUrl: values.imageUrl || null,
        gallery: gallery.length ? gallery : null,
        active: values.active,
      },
      {
        onSuccess: () => {
          if (!isEdit) {
            reset(buildDefaultValues());
            setSlugTouched(false);
          }
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {mutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-primary-soft/50 p-3 text-sm font-medium text-primary-strong">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {isEdit ? 'Cambios guardados. Ya está en el catálogo.' : 'Producto creado. Ya está en el catálogo.'}
        </div>
      )}
      {mutation.isError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {mutation.error?.message ??
            (isEdit ? 'No se pudieron guardar los cambios.' : 'No se pudo crear el producto.')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Amigurumi Osito Martín"
            {...register('name', {
              onChange: (e) => {
                if (!slugTouched) {
                  setValue('slug', slugify(e.target.value), { shouldValidate: false });
                }
              },
            })}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug (URL)
            <button
              type="button"
              className="ml-2 text-xs font-normal text-primary-strong underline"
              onClick={() => setSlugTouched((v) => !v)}
            >
              {slugTouched ? 'autogenerar' : 'editar'}
            </button>
          </Label>
          <Input
            id="slug"
            placeholder="amigurumi-osito-martin"
            readOnly={!slugTouched}
            {...register('slug')}
          />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Pieza tejida a mano, ideal para regalar…"
          {...register('description')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio (S/)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="85"
            {...register('price', { setValueAs: (v) => (v === '' ? 0 : Number(v)) })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            className="h-11 w-full rounded-[12px] border border-input bg-background px-3 text-sm"
            {...register('categoryId')}
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Disponibilidad</Label>
          <select
            id="availability"
            className="h-11 w-full rounded-[12px] border border-input bg-background px-3 text-sm"
            {...register('availability')}
          >
            <option value="in_stock">En stock</option>
            <option value="made_to_order">Bajo pedido</option>
          </select>
        </div>
      </div>

      {availability === 'made_to_order' && (
        <div className="space-y-1.5">
          <Label htmlFor="leadTime">Días estimados de fabricación</Label>
          <Input
            id="leadTime"
            type="number"
            min="1"
            placeholder="7"
            {...register('leadTime', {
              setValueAs: (v) => (v === '' ? null : Number(v)),
            })}
          />
          {errors.leadTime && (
            <p className="text-xs text-destructive">{errors.leadTime.message}</p>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          {...register('active')}
        />
        Producto activo (visible en la tienda)
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Imagen principal</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="imageUrl"
            placeholder="https://… o sube una foto"
            {...register('imageUrl')}
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
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        {!uploadError && (
          <p className="text-xs text-muted-foreground">
            Sube desde tu equipo y se guarda en Supabase Storage (max 5 MB).
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="galleryText">Galería (URLs separadas por coma)</Label>
        <Input
          id="galleryText"
          placeholder="https://…, https://…"
          {...register('galleryText')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="gap-2"
          disabled={isSubmitting || mutation.isPending}
        >
          {isSubmitting || mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : isEdit ? (
            <Save className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
