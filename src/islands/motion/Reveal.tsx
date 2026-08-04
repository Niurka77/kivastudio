import { useSyncExternalStore, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@/lib/motion';

/**
 * Reveal: base del sistema de movimiento (fade + slide suave).
 * - Sin rebotes; curvas de marca; duración base 300ms (DESIGN_SYSTEM).
 * - Respeta `prefers-reduced-motion` (accesibilidad, ADR D.1).
 * Ver 09_ANIMATION_SYSTEM.md.
 */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

export default function Reveal({
  children,
  delay = 0,
  y = MOTION.distance.medium,
  className,
  once = true,
}: RevealProps) {
  // `mounted` evita discrepancias de hidratación en SSR (sin setState en efecto).
  const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const prefersReduced = useReducedMotion();

  // Si el usuario prefiere menos movimiento, mostramos el contenido sin animar.
  if (!isMounted || prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base / 1000,
        delay,
        ease: MOTION.ease.out,
      }}
      viewport={{ once }}
    >
      {children}
    </motion.div>
  );
}
