import { useMemo, useState } from 'react';
import { Check, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { QueryProvider } from '@/components/providers/query-provider';
import TypingTitle from '@/islands/TypingTitle';
import { CATEGORIES, getCategoryLabel } from '@/lib/categories';
import { AVAILABILITY_META } from '@/lib/availability';
import { formatPrice } from '@/lib/price';
import { fetchProducts } from '@/lib/api/products';
import { useCartStore } from '@/stores/cart';
import { waLink } from '@/lib/whatsapp';
import type { Product } from '@/types';

/**
 * Catálogo interactivo (CLIENT STATE + SERVER STATE).
 * - Filtros por categoría en vivo (Todas + CATEGORIES).
 * - Ficha de producto en modal: galería, descripción detallada, cantidad.
 * - Lee el catálogo con TanStack Query (SERVER STATE, ADR A.1); si la API aún
 *   no responde (p. ej. sin tabla crear), usa los productos seed como iniciales.
 */
interface Props {
  products: Product[];
}

type Filter = 'all' | string;

function ProductCatalogInner({ products: seed }: Props) {
  const { addLine, openCart } = useCartStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    placeholderData: () => seed,
    staleTime: 30_000,
  });
  const products = data ?? (isPending ? seed : []);

  const filtered = useMemo(
    () => (filter === 'all' ? products : products.filter((p) => p.categoryId === filter)),
    [products, filter],
  );

  const openDetail = (product: Product) => {
    setSelected(product);
    setGalleryIndex(0);
    setQty(1);
    setAdded(false);
  };

  const handleAdd = (productId: string, quantity: number) => {
    addLine(productId, quantity);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      setSelected(null);
      openCart();
    }, 600);
  };

  const gallery = selected?.gallery?.length
    ? selected.gallery
    : selected?.imageUrl
      ? [selected.imageUrl]
      : [];
  const mainImage = gallery[galleryIndex] ?? selected?.imageUrl ?? '/logo.webp';
  const meta = selected ? AVAILABILITY_META[selected.availability] : null;

  return (
    <section id="productos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <TypingTitle
            text="Nuestros productos"
            tag="h2"
            className="text-3xl sm:text-4xl"
          />
          <p className="mt-2 max-w-xl text-muted-foreground">
            Piezas tejidas a mano, en stock o fabricadas bajo pedido.
          </p>
        </div>
      </header>

      <div
        className="mt-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className={[
            'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
            filter === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary-strong',
          ].join(' ')}
        >
          Todas
        </button>
        {CATEGORIES.map((cat) => {
          const active = filter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(active ? 'all' : cat.id)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary-strong',
              ].join(' ')}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => {
          const productMeta = AVAILABILITY_META[product.availability];
          return (
            <li key={product.id}>
              <Card className="group flex h-full flex-col overflow-hidden">
                <button
                  type="button"
                  aria-label={`Ver ficha de ${product.name}`}
                  onClick={() => openDetail(product)}
                  className="relative aspect-square w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <img
                    src={product.imageUrl ?? '/logo.webp'}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3">
                    <Badge variant={productMeta.variant}>{productMeta.label}</Badge>
                  </span>
                </button>
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <button
                    type="button"
                    aria-label={`Ver ficha de ${product.name}`}
                    onClick={() => openDetail(product)}
                    className="text-left"
                  >
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </button>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div className="flex flex-col">
                      <span className="font-heading text-xl font-bold text-primary-strong">
                        {formatPrice(product.price)}
                      </span>
                      {product.availability === 'made_to_order' &&
                        product.leadTime != null && (
                          <span className="text-xs text-muted-foreground">
                            Listo en ~{product.leadTime} días
                          </span>
                        )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAdd(product.id, 1)}
                      aria-label={`Añadir ${product.name} al carrito`}
                    >
                      <ShoppingBag className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          No hay productos en esta categoría todavía.
        </p>
      )}

      <Dialog
        open={selected != null}
        onOpenChange={(o) => (o ? null : setSelected(null))}
      >
        <DialogContent className="max-w-3xl gap-6 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <img
                src={mainImage}
                alt={selected?.name ?? 'Producto'}
                className="aspect-square w-full rounded-[20px] object-cover"
              />
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-2" role="group" aria-label="Galería">
                  {gallery.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      aria-label={`Ver foto ${i + 1}`}
                      aria-pressed={i === galleryIndex}
                      onClick={() => setGalleryIndex(i)}
                      className={[
                        'h-16 w-16 overflow-hidden rounded-[10px] border transition-colors',
                        i === galleryIndex
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/40',
                      ].join(' ')}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {meta && selected && (
                <div className="flex items-center gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <Badge variant="secondary">
                    {getCategoryLabel(selected.categoryId)}
                  </Badge>
                </div>
              )}
              <DialogTitle className="mt-3 text-2xl">{selected?.name}</DialogTitle>
              {selected?.description && (
                <DialogDescription className="mt-2">
                  {selected.description}
                </DialogDescription>
              )}
              {selected && (
                <div className="mt-4">
                  <span className="font-heading text-2xl font-bold text-primary-strong">
                    {formatPrice(selected.price)}
                  </span>
                  {selected.availability === 'made_to_order' &&
                    selected.leadTime != null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fabricación bajo pedido · listo en ~{selected.leadTime} días
                      </p>
                    )}
                </div>
              )}

              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 rounded-[16px] border border-border">
                    <button
                      type="button"
                      aria-label="Disminuir cantidad"
                      className="p-2.5 text-muted-foreground transition-colors hover:text-primary-strong"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar cantidad"
                      className="p-2.5 text-muted-foreground transition-colors hover:text-primary-strong"
                      onClick={() => setQty((q) => q + 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={() => selected && handleAdd(selected.id, qty)}
                    disabled={!selected}
                  >
                    {added ? (
                      <>
                        <Check className="size-5" aria-hidden="true" /> ¡Añadido!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-5" aria-hidden="true" /> Añadir al
                        carrito
                      </>
                    )}
                  </Button>
                </div>
                {selected && (
                  <a
                    href={waLink(
                      `Hola Kiva Studio, me interesa "${selected.name}" (${formatPrice(selected.price)}).`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-border bg-background p-3 text-sm font-semibold text-primary-strong transition-colors hover:bg-secondary"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Consultar este producto por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function ProductCatalog(props: Props) {
  return (
    <QueryProvider>
      <ProductCatalogInner {...props} />
    </QueryProvider>
  );
}
