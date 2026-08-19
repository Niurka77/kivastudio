import { useState } from 'react';
import { ChevronDown, Heart, Sparkles } from 'lucide-react';

/**
 * Sección de preguntas frecuentes + guía de cuidados del crochet.
 * Acordeón accesible (botones con aria-expanded y panel asociado).
 */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: '¿Cuánto tarda mi pedido?',
    a: 'Las piezas en stock se envían en 2 o 3 días. Las hechas bajo pedido suelen tardar entre 7 y 15 días, según el tamaño y los colores. Al hacer el pedido te confirmamos el plazo exacto por WhatsApp.',
  },
  {
    q: '¿Puedo pedir una pieza personalizada?',
    a: '¡Claro! Elige colores, añade un nombre o cuéntanos tu idea. Cada pieza personalizada se teje especialmente para ti. Escríbenos por WhatsApp o Instagram y te pasamos el presupuesto.',
  },
  {
    q: '¿Cómo se hace el pago?',
    a: 'Por Yape, Plin o transferencia bancaria. El pedido se confirma cuando recibimos el pago, y te avisamos en cada paso del proceso con fotos y videos.',
  },
  {
    q: '¿Hacen envíos?',
    a: 'Sí, enviamos a todo el Perú. Dentro de Lima puede coordinarse entrega, y al resto del país se envía por agencia o courier. El costo de envío depende del destino.',
  },
  {
    q: '¿Puedo regalar una pieza?',
    a: 'Por supuesto. Muchas de nuestras piezas nacen para regalar. Si quieres, envolvemos el pedido y podemos añadir una tarjeta con tu mensaje.',
  },
  {
    q: '¿Las piezas se pueden lavar?',
    a: 'Sí, pero con cuidado. Consulta la guía de cuidados aquí abajo: lavado a mano con agua fría y secado a la sombra. Así tu amigurumi o bolso dura muchísimo.',
  },
];

const CARE_TIPS: string[] = [
  'Lava a mano con agua fría y un jabón suave. Evita la lavadora y el centrifugado.',
  'No uses secadora ni planches directamente el tejido.',
  'Seca en horizontal, a la sombra y sobre una toalla, para que no se deforme.',
  'Si el tejido se apelmaza, cepíllalo suavemente o pásale un poco de vapor sin tocar el hilo.',
  'Guarda las piezas en un lugar seco. Los peluches y amigurumis recuperan su forma con un cepillo de jersey.',
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i;
          const panelId = `faq-panel-${i}`;
          const buttonId = `faq-button-${i}`;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-[16px] border border-border bg-background"
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-foreground transition-colors hover:bg-secondary/60"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-primary-strong transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {open && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="border-t border-border px-5 py-4 text-muted-foreground"
                >
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <aside className="h-fit rounded-[20px] border border-border bg-secondary/50 p-6 lg:sticky lg:top-24">
        <div className="flex items-center gap-2 text-primary-strong">
          <Heart className="size-5" aria-hidden="true" />
          <h3 className="font-heading text-lg font-bold text-foreground">
            Guía de cuidados del crochet
          </h3>
        </div>
        <ul className="mt-4 space-y-3">
          {CARE_TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary-soft" aria-hidden="true" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-[12px] bg-primary-soft/40 p-3 text-xs text-muted-foreground">
          Con estos cuidados, tu pieza tejida a mano te acompañará por mucho
          tiempo.
        </p>
      </aside>
    </div>
  );
}