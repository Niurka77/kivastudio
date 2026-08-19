/**
 * Decoraciones laterales de una sección (versión React para las islas).
 * El contenedor de la sección debe ser `relative overflow-hidden`.
 */
export default function SectionDecor({
  left,
  right,
}: {
  left?: string | null;
  right?: string | null;
}) {
  return (
    <>
      {left && (
        <img
          src={left}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-0 w-20 -translate-y-1/2 select-none opacity-90 sm:left-8 sm:w-32"
        />
      )}
      {right && (
        <img
          src={right}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 z-0 w-20 -translate-y-1/2 select-none opacity-90 sm:right-8 sm:w-32"
        />
      )}
    </>
  );
}