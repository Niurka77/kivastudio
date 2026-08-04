/**
 * Tokens del sistema de movimiento de la marca (ver 09_ANIMATION_SYSTEM.md).
 *
 * DESIGN_SYSTEM: animaciones muy lentas, fade/scale/slide, duración base 300ms,
 * nunca rebotes ni efectos exagerados. Movimiento físico y elegante (ADR D.1).
 *
 * La preferencia `prefers-reduced-motion` se maneja en los componentes con
 * `useReducedMotion` de Framer Motion (ver src/islands/motion/*).
 */

export const MOTION = {
  /** Duraciones (ms) */
  duration: {
    fast: 200,
    base: 300,
    slow: 500,
    slower: 700,
  },

  /** Curvas de easing (cubic-bezier), suaves y sin rebotes */
  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
    in: [0.55, 0.06, 0.68, 0.19] as const,
    out: [0.16, 1, 0.3, 1] as const,
    // "físico" sutil para el ovillo: sale despacio y frena de forma natural
    physical: [0.22, 1, 0.36, 1] as const,
  },

  /** Distancias de slide (px) */
  distance: {
    small: 16,
    medium: 32,
    large: 64,
  },
} as const;
