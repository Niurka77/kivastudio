import { useEffect, useLayoutEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@/lib/motion';

/**
 * Titular del hero "Piezas tejidas a mano, con amor".
 * - Se escribe letra a letra (efecto máquina de escribir), breve y legible.
 * - Un ovillo de lana "teje" las letras: se bambolea mientras escribe y se
 *   asienta al terminar.
 * - Usa la fuente display de la marca (Kingthings Needles); el texto no lleva
 *   acentos, así que la manuscrita lo cubre al 100%.
 * - SSR: el primer render incluye el título completo (SEO y sin-JS). En cliente
 *   se borra y empieza a escribir sin parpadeo (useLayoutEffect, antes del paint).
 * - Respeta `prefers-reduced-motion`: texto completo, sin animación (ADR D.1).
 */

const FULL = 'Piezas tejidas a mano, con amor';
const ACCENT_AT = 'Piezas tejidas a mano, '.length;
const TYPE_SPEED = 55; // ms por letra: ~1.7s total, legible
const CARET_STAY = MOTION.duration.slower + 500; // el cursor parpadea un momento tras terminar

export default function TypingTitle() {
  const prefersReduced = useReducedMotion();
  const [count, setCount] = useState(FULL.length);
  const [done, setDone] = useState(false);
  const [showCaret, setShowCaret] = useState(true);

  useLayoutEffect(() => {
    if (prefersReduced) return;
    let i = 0;
    // Reset antes del primer paint (sin parpadeo ni setState síncrono en el efecto).
    const raf = requestAnimationFrame(() => setCount(0));
    const id = setInterval(() => {
      i += 1;
      setCount(Math.min(i, FULL.length));
      if (i >= FULL.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TYPE_SPEED);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [prefersReduced]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setShowCaret(false), CARET_STAY);
    return () => clearTimeout(t);
  }, [done]);

  const plain = FULL.slice(0, Math.min(count, ACCENT_AT));
  const accent = FULL.slice(ACCENT_AT, count);

  return (
    <h1 className="font-display mt-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
      <span>{plain}</span>
      <span className="text-primary-strong">{accent}</span>

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
    </h1>
  );
}

function YarnBall() {
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
