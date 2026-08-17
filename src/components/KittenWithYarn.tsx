import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Gatito jugando con un ovillo de lana (motivo de marca).
 * - Ilustración plana estilo amigurumi, con los colores de la paleta (DESIGN_SYSTEM).
 * - El ovillo rebota y la colita se mece; respeta `prefers-reduced-motion` (ADR D.1).
 * - Puramente decorativa: `aria-hidden` y decorativo, no aporta información.
 */
export default function KittenWithYarn({ className }: { className?: string }) {
  const prefersReduced = useReducedMotion();

  return (
    <svg
      viewBox="0 0 240 220"
      className={cn('w-full', className)}
      role="presentation"
      aria-hidden="true"
      fill="none"
    >
      {/* sombra en el suelo */}
      <ellipse cx="120" cy="200" rx="86" ry="12" fill="#1B1A1C" opacity="0.06" />

      {/* colita */}
      <motion.path
        d="M 176 146 Q 208 146 210 116 Q 212 96 199 88"
        stroke="#E7A26B"
        strokeWidth="15"
        strokeLinecap="round"
        animate={prefersReduced ? { rotate: 0 } : { rotate: [0, 8, -6, 0] }}
        transition={
          prefersReduced
            ? { duration: 0.3 }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transformOrigin: '176px 146px' }}
      />
      <path
        d="M 176 146 Q 208 146 210 116 Q 212 96 199 88"
        stroke="#F5C29B"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* orejas */}
      <path d="M 78 66 L 82 18 L 120 46 Z" fill="#E7A26B" />
      <path d="M 162 66 L 158 18 L 120 46 Z" fill="#E7A26B" />
      <path d="M 88 55 L 90 32 L 112 46 Z" fill="#FDB6C6" />
      <path d="M 152 55 L 150 32 L 128 46 Z" fill="#FDB6C6" />

      {/* cabeza */}
      <circle cx="120" cy="90" r="48" fill="#F5C29B" />

      {/* mejillas sonrojadas */}
      <ellipse cx="86" cy="102" rx="9" ry="6" fill="#FDB6C6" opacity="0.7" />
      <ellipse cx="154" cy="102" rx="9" ry="6" fill="#FDB6C6" opacity="0.7" />

      {/* ojos */}
      <circle cx="104" cy="84" r="6" fill="#4A3131" />
      <circle cx="136" cy="84" r="6" fill="#4A3131" />
      <circle cx="106.5" cy="82" r="2" fill="#fff" />
      <circle cx="138.5" cy="82" r="2" fill="#fff" />

      {/* nariz y boca */}
      <path d="M 120 90 L 116.5 98 L 123.5 98 Z" fill="#E7819F" strokeLinejoin="round" />
      <path d="M 110 106 Q 120 112 120 105 M 130 106 Q 120 112 120 105"
        stroke="#4A3131" strokeWidth="2.4" strokeLinecap="round" />

      {/* bigotes */}
      <g stroke="#B98A64" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M 70 92 L 90 96" />
        <path d="M 68 99 L 88 101" />
        <path d="M 72 107 L 90 106" />
        <path d="M 170 92 L 150 96" />
        <path d="M 172 99 L 152 101" />
        <path d="M 168 107 L 150 106" />
      </g>

      {/* cuerpo */}
      <path d="M 76 128 Q 120 104 164 128 L 176 174 Q 120 196 64 174 Z" fill="#F5C29B" />
      <path d="M 88 140 Q 120 124 152 140 L 160 172 Q 120 186 80 172 Z" fill="#FCE7D2" />

      {/* patitas delanteras */}
      <path d="M 92 162 L 118 162 L 118 190 Q 92 190 88 178 Z" fill="#F5C29B" />
      <path d="M 122 162 L 148 162 L 152 178 Q 148 190 122 190 Z" fill="#F5C29B" />

      {/* hebra del ovillo hacia la patita */}
      <motion.path
        d="M 132 152 Q 140 140 134 122"
        stroke="#E8558E"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="6 5"
        animate={prefersReduced ? {} : { strokeDashoffset: [0, -22] }}
        transition={
          prefersReduced ? { duration: 0.3 } : { duration: 1.6, repeat: Infinity, ease: 'linear' }
        }
      />

      {/* ovillo de lana juguetón */}
      <motion.g
        animate={prefersReduced ? { y: 0 } : { y: [0, -9, -2, -9, 0] }}
        transition={
          prefersReduced ? { duration: 0.3 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <circle cx="126" cy="170" r="22" fill="#F25F9D" />
        <g stroke="#fff" strokeOpacity="0.35" strokeWidth="2.6" strokeLinecap="round">
          <path d="M 112 152 C 120 160, 120 180, 112 188" />
          <path d="M 140 152 C 132 160, 132 180, 140 188" />
          <path d="M 106 166 C 116 162, 136 162, 146 166" />
          <path d="M 106 174 C 116 178, 136 178, 146 174" />
        </g>
      </motion.g>
    </svg>
  );
}