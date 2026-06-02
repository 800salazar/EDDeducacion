import Link from "next/link";
import { BotonEliminar } from "@/components/admin/BotonEliminar";
import { eliminarSegmento } from "@/app/admin/actions";
import { listarSegmentosAdmin } from "@/lib/admin-data";
import { fechaCorta } from "@/lib/format";

export default async function AdminDashboard() {
  const segmentos = await listarSegmentosAdmin();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Segmentos
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            {segmentos.length} en total · sube y administra el contenido semanal.
          </p>
        </div>
        <Link
          href="/admin/segmentos/nuevo"
          className="rounded-xl bg-bni px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-bni-dark"
        >
          + Nuevo segmento
        </Link>
      </div>

      {segmentos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
          <p className="text-lg font-semibold text-ink">
            Aún no hay segmentos.
          </p>
          <p className="mt-1 text-sm text-ink/55">
            Crea el primero con el botón “Nuevo segmento”.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          {segmentos.map((s, i) => (
            <div
              key={s.id}
              className={
                "flex items-center justify-between gap-4 px-5 py-4 " +
                (i > 0 ? "border-t border-black/5" : "")
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/segmentos/${s.id}`}
                    className="truncate font-semibold text-ink hover:text-bni-dark"
                  >
                    {s.titulo}
                  </Link>
                  {s.publicado ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      Publicado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-ink/50">
                  {fechaCorta(s.fecha)}
                  {s.expositor ? ` · ${s.expositor}` : ""}
                  {s.tema ? ` · ${s.tema}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/segmentos/${s.id}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5"
                >
                  Editar
                </Link>
                <BotonEliminar
                  action={eliminarSegmento}
                  hidden={{ id: s.id }}
                  mensaje={`¿Eliminar "${s.titulo}" y sus aplicaciones?`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
