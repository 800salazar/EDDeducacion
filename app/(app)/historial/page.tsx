import Link from "next/link";
import { SegmentoCard } from "@/components/SegmentoCard";
import { getSegmentos, getTemas } from "@/lib/data";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tema?: string }>;
}) {
  const { q, tema } = await searchParams;
  const [segmentos, temas] = await Promise.all([
    getSegmentos({ q, tema }),
    getTemas(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Historial de segmentos
      </h1>
      <p className="mt-1 text-[15px] text-ink/55">
        Busca por tema, expositor o palabra clave.
      </p>

      {/* Búsqueda (form GET, sin JS) */}
      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar…"
          className="h-11 flex-1 rounded-xl border border-black/10 bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
        />
        {tema && <input type="hidden" name="tema" value={tema} />}
        <button
          type="submit"
          className="h-11 rounded-xl bg-bni px-5 text-sm font-semibold text-white transition hover:bg-bni-dark"
        >
          Buscar
        </button>
      </form>

      {/* Filtro por tema */}
      {temas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip label="Todos" href={hrefCon({ q })} activo={!tema} />
          {temas.map((t) => (
            <Chip
              key={t}
              label={t}
              href={hrefCon({ q, tema: t })}
              activo={tema === t}
            />
          ))}
        </div>
      )}

      {/* Resultados */}
      <div className="mt-8">
        {segmentos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center text-ink/55">
            No se encontraron segmentos
            {q ? <> para “{q}”</> : null}.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {segmentos.map((s) => (
              <SegmentoCard key={s.id} segmento={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Chip({
  label,
  href,
  activo,
}: {
  label: string;
  href: string;
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
        (activo
          ? "bg-bni text-white"
          : "border border-black/10 bg-white text-ink/70 hover:border-bni/40 hover:text-bni-dark")
      }
    >
      {label}
    </Link>
  );
}

function hrefCon(params: { q?: string; tema?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tema) sp.set("tema", params.tema);
  const qs = sp.toString();
  return qs ? `/historial?${qs}` : "/historial";
}
