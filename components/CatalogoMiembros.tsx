"use client";

/* eslint-disable @next/next/no-img-element -- fotos públicas con URLs dinámicas */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Miembro, PerfilMiembro } from "@/lib/types";

type MiembroCatalogo = Pick<PerfilMiembro, "usuario" | "foto_url"> & {
  miembro: Miembro;
};

export function CatalogoMiembros({ miembros }: { miembros: MiembroCatalogo[] }) {
  const [busqueda, setBusqueda] = useState("");
  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return miembros;
    return miembros.filter(({ miembro }) =>
      normalizar(`${miembro.nombre} ${miembro.giro} ${miembro.empresa ?? ""}`).includes(
        termino
      )
    );
  }, [busqueda, miembros]);

  return (
    <div>
      <label htmlFor="buscar-invitado" className="sr-only">
        Buscar miembro
      </label>
      <input
        id="buscar-invitado"
        type="search"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        placeholder="Buscar por nombre, giro o empresa"
        className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-bni focus:ring-2 focus:ring-bni/20"
      />

      {filtrados.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/50">
          No encontramos miembros con esa búsqueda.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map(({ usuario, foto_url, miembro }) => (
            <Link
              key={miembro.id}
              href={`/${usuario}`}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-bni/35 hover:shadow-md"
            >
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-bni text-sm font-bold text-white">
                {foto_url ? (
                  <img src={foto_url} alt="" className="size-full object-cover" />
                ) : (
                  iniciales(miembro.nombre)
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">{miembro.nombre}</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-ink/55">
                  {miembro.giro}
                </span>
                {miembro.empresa && (
                  <span className="mt-0.5 block truncate text-xs text-ink/40">
                    {miembro.empresa}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
