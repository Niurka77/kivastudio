import { useSyncExternalStore } from 'react';

/**
 * Estado reactivo del tema (claro/oscuro) en el navegador.
 * - Arranca con la preferencia del sistema y permite guardar la elección en
 *   localStorage.
 * - Aplica la clase `.dark` en <html>; el CSS usa variables semánticas que se
 *   sobreescriben en `.dark` (ver globals.css).
 * - `initTheme` se llama desde la isla del selector y se re-evalúa al cambiar
 *   la preferencia del sistema si el usuario no ha elegido una explícita.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'kiva-theme';

let theme: Theme = 'light';
const listeners = new Set<() => void>();
let initialized = false;

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function emit() {
  listeners.forEach((l) => l());
}

function apply(next: Theme) {
  theme = next;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
  emit();
}

function storedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'dark' || raw === 'light' ? raw : null;
}

/** Aplica el tema inicial y escucha cambios de la preferencia del sistema. */
export function initTheme() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  apply(storedTheme() ?? systemTheme());

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (!window.localStorage.getItem(STORAGE_KEY)) apply(systemTheme());
  };
  media.addEventListener('change', onChange);
}

/** Cambia el tema y lo guarda. */
export function setTheme(next: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* sin persistencia: no pasa nada */
  }
  apply(next);
}

/** Tema actual. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => theme,
    () => 'light',
  );
}