import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AplicacionGiro } from "@/components/AplicacionGiro";
import { SegmentoMedia } from "@/components/SegmentoMedia";
import {
  getAplicacionParaMiembro,
  getSegmento,
} from "@/lib/data";
import { fechaLarga } from "@/lib/format";
import { getMiembroActual } from "@/lib/sesion-miembro";

export default async function SegmentoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const segmento = await getSegmento(id);
  if (!segmento || !segmento.publicado) notFound();

  const miembro = await getMiembroActual();
  const aplicacion = await getAplicacionParaMiembro(
    segmento.id,
    miembro?.categoria ?? null
  );

  const urlWhatsApp = await construirLinkWhatsApp(segmento.titulo, segmento.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-10">
      <Link
        href="/historial"
        className="text-sm font-medium text-ink/50 transition hover:text-ink"
      >
        ← Volver al historial
      </Link>

      <article className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {segmento.tema && (
            <span className="rounded-full bg-bni/10 px-2.5 py-0.5 font-medium text-bni-dark">
              {segmento.tema}
            </span>
          )}
          <span className="text-ink/45">{fechaLarga(segmento.fecha)}</span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
          {segmento.titulo}
        </h1>
        {segmento.expositor && (
          <p className="mt-2 text-[15px] text-ink/55">
            Expositor: <span className="text-ink/80">{segmento.expositor}</span>
          </p>
        )}

        {segmento.resumen && (
          <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Resumen ejecutivo
            </h2>
            <div className="prosa mt-2 text-[15px] text-ink/85">
              {segmento.resumen}
            </div>
          </section>
        )}

        {/* Aplicación por giro: el bloque más importante */}
        <div className="mt-6">
          <AplicacionGiro miembro={miembro} aplicacion={aplicacion} />
        </div>

        {segmento.ideas_clave && (
          <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
              Ideas clave
            </h2>
            <div className="prosa mt-2 text-[15px] text-ink/85">
              {segmento.ideas_clave}
            </div>
          </section>
        )}

        {/* Medios */}
        <div className="mt-6">
          <SegmentoMedia segmento={segmento} embed />
        </div>

        {/* Transcript (colapsable) */}
        {segmento.transcript && (
          <details className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Ver transcript completo
            </summary>
            <div className="prosa mt-3 text-sm text-ink/75">
              {segmento.transcript}
            </div>
          </details>
        )}

        {/* Compartir */}
        <div className="mt-8 flex items-center gap-3 border-t border-black/5 pt-6">
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Compartir por WhatsApp
          </a>
        </div>
      </article>
    </main>
  );
}

async function construirLinkWhatsApp(
  titulo: string,
  id: string
): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/segmentos/${id}`;
  const texto = `📌 ${titulo} — BNI EDD Insights\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
