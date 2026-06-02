// Marca textual del capítulo. Cuando tengas el logo oficial en PNG/SVG,
// reemplaza el badge "BNI" por <Image src="/logo-bni.png" ... />.

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid place-items-center rounded-md bg-bni px-2 py-1 text-sm font-extrabold tracking-tight text-white shadow-sm">
        BNI
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-ink">
            Emprendedores del Desierto
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-bni">
            Insights
          </span>
        </span>
      )}
    </span>
  );
}
