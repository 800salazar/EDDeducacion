import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioSemana, EliminarMentoria } from "@/components/admin/MentoriaForms";
import { obtenerMentoria } from "@/lib/mentores-data";

export const metadata: Metadata = { title: "Seguimiento de mentoría · Admin", robots: { index: false, follow: false } };

export default async function DetalleMentoria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pareja = await obtenerMentoria(id);
  if (!pareja) notFound();
  const avance = pareja.semanas.filter((s) => s.completada).length;
  return <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-10">
    <Link href="/admin/mentores" className="text-sm font-medium text-ink/55 hover:text-ink">← Programa mentores</Link>
    <h1 className="mt-4 text-2xl font-bold tracking-tight">Seguimiento de mentoría</h1>
    <div className="my-6 grid gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:grid-cols-2">
      <div><p className="text-xs text-ink/50">Mentor</p><p className="mt-1 font-semibold">{pareja.mentor.nombre}</p></div>
      <div><p className="text-xs text-ink/50">Mentoreado</p><p className="mt-1 font-semibold">{pareja.mentoreado.nombre}</p></div>
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm text-ink/60">{avance} de 7 semanas completadas</p>
        <progress value={avance} max={7} aria-label="Avance de la mentoría" className="h-2 w-full accent-emerald-700" />
      </div>
    </div>
    <p className="mb-4 text-sm text-ink/55">Abre una semana para registrar su avance, notas o imagen de evidencia.</p>
    <div className="space-y-3">
      {[...pareja.semanas].sort((a, b) => a.semana - b.semana).map((s) =>
        <FormularioSemana key={s.semana} registro={s} />)}
    </div>
    <EliminarMentoria id={id} />
  </main>;
}
