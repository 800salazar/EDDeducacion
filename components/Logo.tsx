export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="size-4 rounded-full bg-bni shadow-sm" aria-hidden />
      <span className="text-base font-bold tracking-tight text-ink">
        Educación
      </span>
      {!compact && <span className="sr-only">Inicio</span>}
    </span>
  );
}
