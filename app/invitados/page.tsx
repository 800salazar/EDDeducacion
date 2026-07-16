import Link from "next/link";
import { connection } from "next/server";
import { CatalogoMiembros } from "@/components/CatalogoMiembros";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { getCatalogoPerfiles } from "@/lib/profile-data";

export default async function InvitadosPage() {
  await connection();
  const miembros = await getCatalogoPerfiles();

  return (
    <>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Ir al inicio">
            <Logo />
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/5"
          >
            Soy miembro
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-10">
        <div className="mb-7">
          <p className="text-sm font-semibold text-bni">Directorio del capítulo</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Miembros</h1>
          <p className="mt-2 text-[15px] text-ink/55">
            Encuentra a la persona con la que quieres conectar.
          </p>
        </div>
        <CatalogoMiembros miembros={miembros} />
      </main>

      <SiteFooter />
    </>
  );
}
