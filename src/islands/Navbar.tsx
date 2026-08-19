import { useEffect, useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CartIcon } from '@/components/cart-icon';
import ThemeToggle from '@/islands/ThemeToggle';
import { waLink } from '@/lib/whatsapp';
import { useCartStore } from '@/stores/cart';

/**
 * Barra de navegación (CLIENT STATE -> React en isla).
 * - Sticky con fondo translúcido al hacer scroll.
 * - Contador del carrito desde Zustand; menú móvil con Framer Motion.
 * - Accesibilidad: menú con aria-expanded, cierre al pulsar Escape, Respeta
 *   `prefers-reduced-motion` (ADR D.1).
 */
const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Productos', href: '#productos' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full transition-colors',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent bg-background',
      ].join(' ')}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <a
          href="/"
          aria-label="Kiva Studio — ir al inicio"
          className="inline-flex shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <img
            src="/logo.webp"
            alt="Kiva Studio"
            width={256}
            height={256}
            loading="lazy"
            className="h-14 w-auto"
          />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-[12px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft/40 hover:text-primary-strong"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <a
            href={waLink('Hola Kiva Studio, quisiera hacer un pedido.')}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex"
          >
            <Button size="sm" className="gap-2">
              <MessageCircle className="size-4" aria-hidden="true" />
              Pedir por WhatsApp
            </Button>
          </a>

          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir carrito"
            className="relative"
            onClick={() => useCartStore.getState().openCart()}
          >
            <CartIcon />
          </Button>

          <Button
            variant="ghost"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReduced ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-[12px] px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-primary-soft/40 hover:text-primary-strong"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2 pb-2">
                <a
                  href={waLink('Hola Kiva Studio, quisiera hacer un pedido.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Pedir por WhatsApp
                  </Button>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
