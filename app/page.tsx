import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MiembroSelector } from "@/components/MiembroSelector";
import { getMiembros } from "@/lib/data";
import { getMiembroIdSeleccionado } from "@/lib/sesion-miembro";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Si ya eligió miembro, va directo al contenido.
  if (await getMiembroIdSeleccionado()) {
    redirect("/inicio");
  }

  const [{ error }, miembros] = await Promise.all([
    searchParams,
    getMiembros(),
  ]);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xl shadow-black/[0.03] sm:p-9">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Aprendizaje práctico semanal
            <span className="block text-bni">para aplicar en tu negocio.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/60">
            Consulta los segmentos del capítulo, lee resúmenes ejecutivos y
            recibe ideas accionables según tu giro.
          </p>

          <div className="mt-7">
            <MiembroSelector miembros={miembros} error={error === "elige"} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          ¿Eres el coordinador?{" "}
          <Link href="/admin" className="font-medium text-ink/60 underline">
            Entrar al panel
          </Link>
        </p>
      </div>
    </main>
  );
}
