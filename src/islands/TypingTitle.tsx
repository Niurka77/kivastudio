import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION } from '@/lib/motion';

/**
 * Título animado reutilizable (estilo del hero, aplicado a todas las secciones).
 * - Escribe el texto letra a letra (efecto máquina de escribir), breve y legible.
 * - Un ovillo de lana "teje" las letras: se bambolea mientras escribe y se
 *   asienta al terminar.
 * - Usa la fuente display de la marca (Kingthings Needles); los caracteres que
 *   la manuscrita no tiene (acentos, ñ, ¿/¡) los completa Outfit vía fallback.
 * - Empieza a escribir solo cuando entra en pantalla (useInView).
 * - SSR: el primer render incluye el título completo (SEO y sin-JS). En cliente
 *   se borra y empieza a escribir sin parpadeo (useLayoutEffect, antes del paint).
 * - Respeta `prefers-reduced-motion`: texto completo, sin animación (ADR D.1).
 */

interface TypingTitleProps {
  text: string;
  /** Índice donde empieza la parte destacada (rosa fuerte). 0 = sin destacar. */
  accentFrom?: number;
  /** Nivel de encabezado (h1 por defecto). */
  tag?: 'h1' | 'h2' | 'h3';
  className?: string;
}

const TYPE_SPEED = 55; // ms por letra — legible y breve
const CARET_STAY = MOTION.duration.slower + 500; // el cursor parpadea un momento tras terminar

export default function TypingTitle({
  text,
  accentFrom = 0,
  tag: Tag = 'h1',
  className,
}: TypingTitleProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const [count, setCount] = useState(text.length);
  const [done, setDone] = useState(false);
  const [showCaret, setShowCaret] = useState(true);
  const accentStart = accentFrom > 0 ? accentFrom : text.length;

  useLayoutEffect(() => {
    if (prefersReduced || !inView) return;
    let i = 0;
    // Reset antes del primer paint (sin parpadeo ni setState síncrono en el efecto).
    const raf = requestAnimationFrame(() => setCount(0));
    const id = setInterval(() => {
      i += 1;
      setCount(Math.min(i, text.length));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TYPE_SPEED);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [prefersReduced, inView, text.length]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setShowCaret(false), CARET_STAY);
    return () => clearTimeout(t);
  }, [done]);

  const shown = Math.min(count, text.length);
  const plain = text.slice(0, Math.min(shown, accentStart));
  const accent = text.slice(accentStart, shown);

  return (
    <Tag
      ref={ref}
      className={cn('font-display font-bold leading-tight text-foreground', className)}
    >
      <span>{plain}</span>
      {accent && <span className="text-primary-strong">{accent}</span>}

      {showCaret && !prefersReduced && (
        <motion.span
          aria-hidden="true"
          className="ml-[0.04em] inline-block h-[0.85em] w-[0.07em] translate-y-[0.08em] rounded-full bg-primary-strong"
          animate={done ? { opacity: 0 } : { opacity: [1, 0.1] }}
          transition={
            done
              ? { duration: MOTION.duration.base / 1000 }
              : { duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      )}

      <motion.span
        aria-hidden="true"
        className="ml-1 inline-block h-[0.85em] w-[0.85em] align-middle text-primary"
        animate={prefersReduced || done ? { rotate: 0 } : { rotate: [0, 12, -10, 6, -4, 0] }}
        transition={
          prefersReduced || done
            ? { duration: 0.4 }
            : { duration: 0.9, repeat: Infinity, ease: MOTION.ease.physical }
        }
        style={{ transformOrigin: '50% 60%' }}
      >
        <YarnBall />
      </motion.span>
    </Tag>
  );
}

export function YarnBall() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" aria-hidden="true">
      {/* hebra que sale del ovillo hacia el texto */}
      <path
        d="M6 44 C 14 46, 17 40, 19 33"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* cuerpo del ovillo */}
      <circle cx="39" cy="32" r="19" fill="currentColor" />
      {/* vueltas de hilo */}
      <g stroke="#fff" strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round">
        <path d="M25 19 C 32 26, 32 38, 25 45" />
        <path d="M53 19 C 46 26, 46 38, 53 45" />
        <path d="M24 30 C 35 24, 44 24, 54 30" />
        <path d="M24 34 C 35 40, 44 40, 54 34" />
      </g>
    </svg>
  );
}