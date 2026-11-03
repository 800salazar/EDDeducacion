import Link from "next/link";
import type { Metadata } from "next";
import { NuevaMentoria, CasillaSemana } from "@/components/admin/MentoriaForms";
import { exigirAdminMentores, listarMentorias, listarMiembrosMentores, PAREJAS_POR_PAGINA } from "@/lib/mentores-data";
import { SEMANAS_MENTORIA } from "@/lib/mentores";

export const metadata: Metadata = { title: "Programa mentores · Admin", robots: { index: false, follow: false } };

export default async function MentoresPage({ searchParams }: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  await exigirAdminMentores();
  const params = await searchParams;
  const busqueda = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const numero = Number(params.pagina);
  const pagina = Number.isSafeInteger(numero) && numero > 0 && numero <= 1000000 ? numero : 1;
  const [miembros, { parejas, total }] = await Promise.all([
    listarMiembrosMentores(), listarMentorias(busqueda, pagina),
  ]);
  const paginas = Math.max(1, Math.ceil(total / PAREJAS_POR_PAGINA));
  const enlacePagina = (p: number) => `/admin/mentores?${new URLSearchParams({ q: busqueda, pagina: String(p) })}`;
  return <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-10">
    <div className="mb-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/45">Control privado · Admin</span>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Programa mentores</h1>
      <p className="mt-2 text-sm text-ink/55">Asigna parejas y lleva su seguimiento durante siete semanas.</p>
    </div>
    <NuevaMentoria miembros={miembros} />
    <form action="/admin/mentores" className="my-6 flex flex-wrap gap-2" role="search">
      <label htmlFor="buscar-mentorias" className="sr-only">Buscar mentor o mentoreado</label>
      <input id="buscar-mentorias" name="q" defaultValue={busqueda} maxLength={120} placeholder="Buscar mentor o mentoreado…"
        className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bni/20" />
      <button className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium hover:bg-black/5">Buscar</button>
      {busqueda ? <Link href="/admin/mentores" className="px-3 py-2.5 text-sm text-ink/60">Limpiar</Link> : null}
    </form>
    <p className="mb-3 text-sm text-ink/55">{total} {total === 1 ? "pareja" : "parejas"}{busqueda ? " encontradas" : " registradas"}</p>
    {parejas.length ? <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
      <table className="w-full min-w-[790px] text-left text-sm">
        <caption className="sr-only">Seguimiento de siete semanas por pareja de mentoría</caption>
        <thead className="border-b border-black/5 bg-black/[0.02] text-xs text-ink/55">
          <tr>
            <th scope="col" className="p-4 font-medium">Mentor</th>
            <th scope="col" className="p-4 font-medium">Mentoreado</th>
            {SEMANAS_MENTORIA.map((s) => <th key={s} scope="col" className="px-3 py-4 text-center font-medium">S{s}</th>)}
            <th scope="col" className="p-4 font-medium">Avance</th>
            <th scope="col" className="p-4"><span className="sr-only">Detalle</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {parejas.map((p) => {
            const avance = p.semanas.filter((s) => s.completada).length;
            return <tr key={p.id} className="hover:bg-black/[0.01]">
              <th scope="row" className="p-4 font-medium">{p.mentor.nombre}{!p.mentor.activo ? <span className="block text-xs text-ink/45">Inactivo</span> : null}</th>
              <td className="p-4">{p.mentoreado.nombre}{!p.mentoreado.activo ? <span className="block text-xs text-ink/45">Inactivo</span> : null}</td>
              {SEMANAS_MENTORIA.map((s) => <td key={s} className="px-3 py-4">
                <CasillaSemana id={p.id} semana={s} completada={p.semanas.some((r) => r.semana === s && r.completada)} pareja={`${p.mentor.nombre} y ${p.mentoreado.nombre}`} />
              </td>)}
              <td className="p-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${avance === 7 ? "bg-emerald-50 text-emerald-800" : "bg-black/5 text-ink/65"}`}>{avance}/7</span></td>
              <td className="p-4"><Link href={`/admin/mentores/${p.id}`} className="whitespace-nowrap font-medium underline underline-offset-4">Ver detalle</Link></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div> : <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 px-5 py-12 text-center text-sm text-ink/55">
      {busqueda ? "No encontramos parejas con ese nombre." : pagina > 1 ? "No hay parejas en esta página." : "Crea tu primera pareja para comenzar el seguimiento."}
    </div>}
    {paginas > 1 || pagina > 1 ? <nav aria-label="Paginación de parejas" className="mt-5 flex items-center justify-between text-sm">
      {pagina > 1 ? <Link href={enlacePagina(pagina - 1)} className="rounded-lg border border-black/10 px-3 py-2">← Anterior</Link> : <span />}
      <span className="text-ink/50">Página {pagina} de {paginas}</span>
      {pagina < paginas ? <Link href={enlacePagina(pagina + 1)} className="rounded-lg border border-black/10 px-3 py-2">Siguiente →</Link> : <span />}
    </nav> : null}
  </main>;
}
