import Link from "next/link";
import { notFound } from "next/navigation";
import { SegmentoForm } from "@/components/admin/SegmentoForm";
import { AplicacionesManager } from "@/components/admin/AplicacionesManager";
import { actualizarSegmento } from "@/app/admin/actions";
import {
  getSegmentoAdmin,
  listarAplicacionesAdmin,
  listarCategorias,
} from "@/lib/admin-data";

export default async function EditarSegmentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const segmento = await getSegmentoAdmin(id);
  if (!segmento) notFound();

  const [aplicaciones, categorias, { ok }] = await Promise.all([
    listarAplicacionesAdmin(id),
    listarCategorias(),
    searchParams,
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin"
          className="text-sm font-medium text-ink/50 transition hover:text-ink"
        >
          ← Volver a segmentos
        </Link>
        <Link
          href={`/segmentos/${segmento.id}`}
          className="text-sm font-medium text-bni hover:text-bni-dark"
        >
          Ver como miembro →
        </Link>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
        Editar segmento
      </h1>

      {ok && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          Cambios guardados.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <SegmentoForm action={actualizarSegmento} segmento={segmento} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-ink">
          Cómo aplicarlo a tu negocio
        </h2>
        <p className="mt-1 text-sm text-ink/55">
          Lo que verá cada miembro según su giro. Este es el valor diferencial.
        </p>
        <div className="mt-5">
          <AplicacionesManager
            segmentoId={segmento.id}
            aplicaciones={aplicaciones}
            categorias={categorias}
          />
        </div>
      </section>
    </main>
  );
}
