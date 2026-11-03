import Link from "next/link";
import { redirect } from "next/navigation";
import { ListaMiembrosAdmin } from "@/components/admin/ListaMiembrosAdmin";
import { crearMiembro } from "@/app/admin/actions";
import { esAdmin } from "@/lib/auth";
import { listarMiembrosAdmin } from "@/lib/admin-data";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

export default async function AdminMiembrosPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await esAdmin())) redirect("/admin");
  const { error } = await searchParams;
  const miembros = await listarMiembrosAdmin();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-10">
      <Link
        href="/admin"
        className="text-sm font-medium text-ink/50 transition hover:text-ink"
      >
        ← Volver
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
        Miembros
      </h1>
      <p className="mt-1 text-sm text-ink/55">
        Solo necesitas capturar <span className="font-medium">nombre</span> y{" "}
        <span className="font-medium">giro</span>. El sistema asigna id/orden,
        categoría derivada y estado activo automáticamente.
      </p>

      {error === "mentorias" ? (
        <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Este miembro participa en el programa mentores. Para conservar su seguimiento,
          primero revisa sus parejas en <Link href="/admin/mentores" className="font-semibold underline">Programa mentores</Link> antes de eliminarlo.
        </p>
      ) : null}

      {/* Alta */}
      <section className="mt-6 rounded-2xl border border-dashed border-black/20 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Agregar miembro</h2>
        <form
          action={crearMiembro}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <input name="nombre" required placeholder="Nombre" className={inputCls} />
          <input
            name="giro"
            required
            placeholder="Giro (ej. Agente de seguros)"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded-lg bg-bni px-4 py-2 text-sm font-semibold text-white transition hover:bg-bni-dark sm:col-span-2"
          >
            + Agregar miembro
          </button>
        </form>
      </section>

      {/* Listado / edición */}
      <ListaMiembrosAdmin miembros={miembros} />
    </main>
  );
}
