import { BotonEliminar } from "@/components/admin/BotonEliminar";
import { eliminarAplicacion, guardarAplicacion } from "@/app/admin/actions";
import type { Aplicacion } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

// Administra el bloque "Cómo aplicarlo a tu negocio" por categoría.
export function AplicacionesManager({
  segmentoId,
  aplicaciones,
  categorias,
}: {
  segmentoId: string;
  aplicaciones: Aplicacion[];
  categorias: string[];
}) {
  // Sugerencias: categorías de miembros + 'general'.
  const sugerencias = Array.from(new Set(["general", ...categorias]));

  return (
    <div className="space-y-4">
      <datalist id="categorias-list">
        {sugerencias.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Existentes */}
      {aplicaciones.map((a) => (
        <form
          key={a.id}
          action={guardarAplicacion}
          className="rounded-xl border border-black/10 bg-white p-4"
        >
          <input type="hidden" name="segmento_id" value={segmentoId} />
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-bni/10 px-2.5 py-0.5 text-xs font-semibold text-bni-dark">
              {a.categoria}
            </span>
            <BotonEliminar
              action={eliminarAplicacion}
              hidden={{ id: a.id, segmento_id: segmentoId }}
              label="Eliminar"
              mensaje={`¿Eliminar la aplicación para "${a.categoria}"?`}
            />
          </div>
          <input type="hidden" name="categoria" value={a.categoria} />
          <textarea
            name="contenido"
            rows={4}
            defaultValue={a.contenido}
            className={inputCls + " mt-3"}
          />
          <button
            type="submit"
            className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Guardar
          </button>
        </form>
      ))}

      {/* Nueva */}
      <form
        action={guardarAplicacion}
        className="rounded-xl border border-dashed border-black/20 bg-white p-4"
      >
        <input type="hidden" name="segmento_id" value={segmentoId} />
        <p className="text-sm font-semibold text-ink">Agregar aplicación</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
          <input
            name="categoria"
            list="categorias-list"
            required
            placeholder="categoría (ej. seguros)"
            className={inputCls}
          />
          <textarea
            name="contenido"
            rows={3}
            required
            placeholder="Acciones, ejemplo de referral, idea de networking…"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-bni px-4 py-2 text-sm font-semibold text-white transition hover:bg-bni-dark"
        >
          + Agregar
        </button>
        <p className="mt-2 text-xs text-ink/45">
          Usa <span className="font-medium">general</span> para una versión que
          vean todos los giros. Las categorías deben coincidir con las de tus
          miembros.
        </p>
      </form>
    </div>
  );
}
