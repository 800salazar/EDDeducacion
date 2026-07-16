import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cambiarMiembro } from "@/app/actions";
import type { Miembro } from "@/lib/types";

// Encabezado de las pantallas internas (después de elegir miembro).
export function SiteHeader({ miembro }: { miembro: Miembro | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <Link href="/inicio" className="shrink-0">
          <Logo />
        </Link>

        {miembro ? (
          <form action={cambiarMiembro} className="ml-auto sm:ml-0">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-1.5 pr-2 text-sm font-medium text-ink transition hover:border-black/20 sm:pr-3"
              title="Cambiar de miembro"
            >
              <span className="grid size-6 place-items-center rounded-full bg-bni text-[11px] font-bold text-white">
                {iniciales(miembro.nombre)}
              </span>
              <span className="hidden max-w-[10rem] truncate sm:inline">
                {miembro.nombre}
              </span>
              <span className="hidden text-xs text-ink/40 sm:inline">Cambiar</span>
              <span className="sr-only sm:hidden">Cambiar de miembro</span>
            </button>
          </form>
        ) : (
          <Link
            href="/"
            className="ml-auto rounded-full bg-bni px-3 py-2 text-sm font-semibold text-white transition hover:bg-bni-dark sm:ml-0 sm:px-4"
          >
            <span className="sm:hidden">Elegir</span>
            <span className="hidden sm:inline">Elegir mi nombre</span>
          </Link>
        )}

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:order-none sm:w-auto sm:overflow-visible sm:pb-0">
          <Link
            href="/inicio"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Inicio
          </Link>
          <Link
            href="/historial"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Historial
          </Link>
          <Link
            href="/album"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Mi Mundial
          </Link>
          <Link
            href="/perfil"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            Mi perfil
          </Link>
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
