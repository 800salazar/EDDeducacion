import Link from "next/link";
import { BotonEliminar } from "@/components/admin/BotonEliminar";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import {
  actualizarMiembro,
  crearMiembro,
  eliminarMiembro,
} from "@/app/admin/actions";
import { listarMiembrosAdmin } from "@/lib/admin-data";
import type { Miembro } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

export default async function AdminMiembrosPage() {
  const miembros = await listarMiembrosAdmin();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-10">
      <Link
        href="/admin"
        className="text-sm font-medium text-ink/50 transition hover:text-ink"
      >
        ← Volver
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
        Miembros
      </h1>
      <p className="mt-1 text-sm text-ink/55">
        Solo necesitas capturar <span className="font-medium">nombre</span> y{" "}
        <span className="font-medium">giro</span>. El sistema asigna id/orden,
        categoría derivada y estado activo automáticamente.
      </p>

      {/* Alta */}
      <section className="mt-6 rounded-2xl border border-dashed border-black/20 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Agregar miembro</h2>
        <form
          action={crearMiembro}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <input name="nombre" required placeholder="Nombre" className={inputCls} />
          <input
            name="giro"
            required
            placeholder="Giro (ej. Agente de seguros)"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded-lg bg-bni px-4 py-2 text-sm font-semibold text-white transition hover:bg-bni-dark sm:col-span-2"
          >
            + Agregar miembro
          </button>
        </form>
      </section>

      {/* Listado / edición */}
      <section className="mt-6 space-y-3">
        {miembros.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center text-ink/55">
            Aún no hay miembros.
          </p>
        ) : (
          miembros.map((m) => <FilaMiembro key={m.id} miembro={m} />)
        )}
      </section>
    </main>
  );
}

function FilaMiembro({ miembro: m }: { miembro: Miembro }) {
  return (
    <article className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">{m.nombre}</p>
          <p className="truncate text-sm text-ink/70">{m.giro}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <details>
            <summary className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-black/5">
              Editar
            </summary>
            <div className="mt-3 min-w-[18rem] rounded-lg border border-black/10 bg-white p-3 sm:min-w-[24rem]">
              <form action={actualizarMiembro} className="space-y-3">
                <input type="hidden" name="id" value={m.id} />
                <input name="nombre" defaultValue={m.nombre} className={inputCls} />
                <input name="giro" defaultValue={m.giro} className={inputCls} />
                <BotonConfirmar
                  label="Guardar cambios"
                  mensaje={`¿Guardar cambios de ${m.nombre}?`}
                  className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
                />
              </form>
            </div>
          </details>

          <BotonEliminar
            action={eliminarMiembro}
            hidden={{ id: m.id }}
            mensaje={`¿Eliminar a ${m.nombre}?`}
            className="rounded-lg border border-bni/20 px-3 py-2 text-sm font-medium text-bni transition hover:bg-bni/10"
          />
        </div>
      </div>
    </article>
  );
}
