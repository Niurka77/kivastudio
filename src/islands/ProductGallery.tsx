import { useState } from 'react';

/**
 * Galería de imágenes de un producto (página propia).
 * Imagen principal + miniaturas de la galería con estado local.
 */
export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const main = images[Math.min(index, Math.max(images.length - 1, 0))] ?? '/logo.webp';

  return (
    <div>
      <div className="overflow-hidden rounded-[24px] border border-border bg-secondary">
        <img
          src={main}
          alt={alt}
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2" role="group" aria-label="Galería de fotos">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={[
                'h-20 w-20 overflow-hidden rounded-[12px] border transition-colors',
                i === index
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
  );
}