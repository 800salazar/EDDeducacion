import Link from "next/link";
import { SegmentoForm } from "@/components/admin/SegmentoForm";
import { crearSegmento } from "@/app/admin/actions";

export default function NuevoSegmentoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-10">
      <Link
        href="/admin"
        className="text-sm font-medium text-ink/50 transition hover:text-ink"
      >
        ← Volver a segmentos
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
        Nuevo segmento
      </h1>
      <p className="mt-1 text-sm text-ink/55">
        Después de crearlo podrás agregar las aplicaciones por giro.
      </p>

      <div className="mt-7 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <SegmentoForm action={crearSegmento} />
      </div>
    </main>
  );
}
