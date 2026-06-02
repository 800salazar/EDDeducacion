import Link from "next/link";
import { fechaCorta } from "@/lib/format";
import type { Segmento } from "@/lib/types";

export function SegmentoCard({ segmento }: { segmento: Segmento }) {
  return (
    <Link
      href={`/segmentos/${segmento.id}`}
      className="group flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-bni/30 hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2 text-xs">
        {segmento.tema && (
          <span className="rounded-full bg-bni/10 px-2.5 py-0.5 font-medium text-bni-dark">
            {segmento.tema}
          </span>
        )}
        <span className="text-ink/40">{fechaCorta(segmento.fecha)}</span>
      </div>

      <h3 className="text-base font-semibold leading-snug text-ink transition group-hover:text-bni-dark">
        {segmento.titulo}
      </h3>

      {segmento.expositor && (
        <p className="mt-1 text-sm text-ink/50">Con {segmento.expositor}</p>
      )}

      {segmento.resumen && (
        <p className="mt-2 line-clamp-2 text-sm text-ink/70">
          {segmento.resumen}
        </p>
      )}

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-bni">
        Ver segmento
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
