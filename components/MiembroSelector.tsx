"use client";

import { useMemo, useState } from "react";
import { entrarComoMiembro } from "@/app/actions";
import type { Miembro } from "@/lib/types";

// Selector del portal: el miembro elige su nombre y entra. Sin login.
// La búsqueda filtra por nombre, giro y empresa para que sea cómoda en móvil.
export function MiembroSelector({
  miembros,
  error,
}: {
  miembros: Miembro[];
  error?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const miembrosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return miembros;

    return miembros.filter((m) =>
      normalizarTexto(`${m.nombre} ${m.giro} ${m.empresa ?? ""}`).includes(
        termino
      )
    );
  }, [busqueda, miembros]);

  return (
    <div className="w-full">
      <label
        htmlFor="buscar_miembro"
        className="mb-2 block text-sm font-medium text-ink/70"
      >
        ¿Quién eres?
      </label>
      <input
        id="buscar_miembro"
        type="search"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        placeholder="Escribe tu nombre, giro o empresa"
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-bni focus:ring-2 focus:ring-bni/20"
      />
      {error && (
        <p className="mt-2 text-sm text-bni">Primero elige tu nombre.</p>
      )}

      {miembros.length === 0 && (
        <p className="mt-3 text-sm text-ink/50">
          Aún no hay miembros cargados. Agrégalos desde el panel{" "}
          <span className="font-medium">/admin</span>.
        </p>
      )}

      {miembros.length > 0 && (
        <form action={entrarComoMiembro} className="mt-3">
          <div className="max-h-[22rem] overflow-y-auto rounded-xl border border-black/10 bg-white shadow-sm">
            {miembrosFiltrados.length > 0 ? (
              miembrosFiltrados.map((m) => (
                <button
                  key={m.id}
                  type="submit"
                  name="miembro_id"
                  value={m.id}
                  className="flex w-full items-center gap-3 border-b border-black/5 px-3 py-3 text-left transition last:border-b-0 hover:bg-black/[0.03] focus:bg-black/[0.04] focus:outline-none"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bni text-sm font-bold text-white">
                    {iniciales(m.nombre)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {m.nombre}
                    </span>
                    <span className="block truncate text-xs font-medium text-ink/50">
                      {m.giro}
                      {m.empresa ? ` · ${m.empresa}` : ""}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ink/50">
                No encontramos a nadie con esa búsqueda.
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-ink/40">
            Toca tu nombre para entrar. La app recordará este dispositivo.
          </p>
        </form>
      )}
    </div>
  );
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
