import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cambiarMiembro } from "@/app/actions";
import type { Miembro } from "@/lib/types";

// Encabezado de las pantallas internas (después de elegir miembro).
export function SiteHeader({ miembro }: { miembro: Miembro | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
        <Link href="/inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/inicio"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Inicio
          </Link>
          <Link
            href="/historial"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Historial
          </Link>

          {miembro ? (
            <form action={cambiarMiembro} className="ml-1 sm:ml-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition hover:border-black/20"
                title="Cambiar de miembro"
              >
                <span className="grid size-6 place-items-center rounded-full bg-bni text-[11px] font-bold text-white">
                  {iniciales(miembro.nombre)}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {miembro.nombre}
                </span>
                <span className="text-xs text-ink/40">Cambiar</span>
              </button>
            </form>
          ) : (
            <Link
              href="/"
              className="ml-1 rounded-full bg-bni px-4 py-2 text-sm font-semibold text-white transition hover:bg-bni-dark sm:ml-2"
            >
              Elegir mi nombre
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
