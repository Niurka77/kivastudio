import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initTheme, setTheme, useTheme } from '@/lib/useTheme';

initTheme();

/**
 * Alternador de tema claro/oscuro. Guarda la elección en localStorage y
 * actualiza la clase `.dark` del <html> (ver useTheme.ts).
 */
export default function ThemeToggle() {
  const theme = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}