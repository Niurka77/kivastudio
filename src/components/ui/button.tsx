import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Botones (DESIGN_SYSTEM):
//  - Primario: fondo rosa principal, texto blanco; hover sube 1.02
//  - Secundario: fondo blanco, borde/texto rosa; hover fondo rosa claro.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground rounded-[16px]',
        secondary: 'bg-secondary text-secondary-foreground rounded-[16px]',
        outline: 'border border-input bg-background rounded-[16px]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary-strong underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-[14px] px-4 text-sm',
        lg: 'h-12 rounded-[16px] px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
export default Button;
