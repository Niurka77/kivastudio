import { cn } from '@/lib/utils';

// Skeleton: estado de carga suave, sin brillos agresivos (identidad serena).
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-primary-soft/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
