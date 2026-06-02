import Link from "next/link";
import { SegmentoCard } from "@/components/SegmentoCard";
import { SegmentoMedia } from "@/components/SegmentoMedia";
import {
  getSegmentoDeLaSemana,
  getSegmentos,
} from "@/lib/data";
import { fechaLarga } from "@/lib/format";
import { getMiembroActual } from "@/lib/sesion-miembro";

export default async function InicioPage() {
  const [miembro, semana] = await Promise.all([
    getMiembroActual(),
    getSegmentoDeLaSemana(),
  ]);

  const todos = await getSegmentos();

  const recientes = todos.filter((s) => s.id !== semana?.id).slice(0, 4);
  const primerNombre = miembro?.nombre.split(/\s+/)[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {primerNombre ? `Hola, ${primerNombre}.` : "Bienvenido."}
        </h1>
        <p className="mt-1 text-[15px] text-ink/55">
          Esto es lo más reciente del capítulo.
        </p>
      </div>

      {!semana ? (
        <EmptyState />
      ) : (
        <section>
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bni px-3 py-1 text-xs font-semibold text-white">
              Segmento de la semana
            </span>
            <h2 className="mt-4 text-xl font-bold leading-snug text-ink sm:text-2xl">
              {semana.titulo}
            </h2>
            <p className="mt-1.5 text-sm text-ink/55">
              {semana.expositor ? `${semana.expositor} · ` : ""}
              {fechaLarga(semana.fecha)}
            </p>

            {semana.resumen && (
              <div className="prosa mt-4 text-[15px] text-ink/80">
                {semana.resumen}
              </div>
            )}

            <div className="mt-5">
              <SegmentoMedia segmento={semana} />
            </div>

            <Link
              href={`/segmentos/${semana.id}`}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Ver segmento completo →
            </Link>
          </article>
        </section>
      )}

      {recientes.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold text-ink">Segmentos recientes</h2>
            <Link
              href="/historial"
              className="text-sm font-medium text-bni hover:text-bni-dark"
            >
              Ver historial →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recientes.map((s) => (
              <SegmentoCard key={s.id} segmento={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
      <p className="text-lg font-semibold text-ink">Aún no hay segmentos.</p>
      <p className="mt-1 text-sm text-ink/55">
        Cuando el coordinador publique el primer segmento, aparecerá aquí.
      </p>
    </div>
  );
}
