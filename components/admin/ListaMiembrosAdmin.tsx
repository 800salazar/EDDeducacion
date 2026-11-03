"use client";

import { useState } from "react";
import { actualizarMiembro, eliminarMiembro } from "@/app/admin/actions";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { BotonEliminar } from "@/components/admin/BotonEliminar";
import type { Miembro } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function ListaMiembrosAdmin({ miembros }: { miembros: Miembro[] }) {
  const [busqueda, setBusqueda] = useState("");
  const palabras = normalizar(busqueda).trim().split(/\s+/).filter(Boolean);
  const filtrados = miembros.filter((m) => {
    const contenido = normalizar(`${m.nombre} ${m.giro} ${m.empresa ?? ""}`);
    return palabras.every((palabra) => contenido.includes(palabra));
  });

  return (
    <section className="mt-6 space-y-3" aria-label="Listado de miembros">
      <div role="search" className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
        <label htmlFor="buscar-miembros" className="mb-2 block text-sm font-semibold">
          Buscar miembros
        </label>
        <div className="flex items-center gap-2">
          <input
            id="buscar-miembros"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, giro o empresa…"
            className={inputCls}
          />
          {busqueda ? (
            <button type="button" onClick={() => setBusqueda("")}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink/60 hover:bg-black/5">
              Limpiar
            </button>
          ) : null}
        </div>
        <p role="status" className="mt-2 text-xs text-ink/50">
          {filtrados.length} de {miembros.length} miembros
        </p>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center text-ink/55">
          {miembros.length === 0 ? "Aún no hay miembros." : "No encontramos miembros con esa búsqueda."}
        </p>
      ) : filtrados.map((m) => <FilaMiembro key={m.id} miembro={m} />)}
    </section>
  );
}

function FilaMiembro({ miembro: m }: { miembro: Miembro }) {
  return (
    <article className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="break-words text-base font-semibold text-ink">{m.nombre}</p>
        <p className="break-words text-sm text-ink/70">{m.giro}</p>
      </div>

      <details className="mt-3">
        <summary className="w-fit cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-black/5">
          Editar miembro
        </summary>
        <form action={actualizarMiembro} className="mt-3 space-y-3 rounded-lg border border-black/10 p-3">
          <input type="hidden" name="id" value={m.id} />
          <label className="block space-y-1 text-sm font-medium">
            <span>Nombre del miembro</span>
            <input name="nombre" required defaultValue={m.nombre} autoComplete="name" className={inputCls} />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Giro</span>
            <input name="giro" required defaultValue={m.giro} className={inputCls} />
          </label>
          <BotonConfirmar
            label="Guardar cambios"
            mensaje={`¿Guardar cambios de ${m.nombre}?`}
            className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          />
        </form>
      </details>

      <div className="mt-3">
        <BotonEliminar
          action={eliminarMiembro}
          hidden={{ id: m.id }}
          mensaje={`¿Eliminar a ${m.nombre}?`}
          className="rounded-lg border border-bni/20 px-3 py-2 text-sm font-medium text-bni transition hover:bg-bni/10"
        />
      </div>
    </article>
  );
}
