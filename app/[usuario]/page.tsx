import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { PerfilPublico } from "@/components/PerfilPublico";
import { SiteFooter } from "@/components/SiteFooter";
import { getPerfilPublicoPorUsuario } from "@/lib/profile-data";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ usuario: string }>;
}) {
  const { usuario } = await params;
  const perfil = await getPerfilPublicoPorUsuario(usuario);
  if (!perfil) notFound();

  return (
    <>
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Ir al inicio">
            <Logo />
          </Link>
          <Link
            href="/invitados"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/5"
          >
            Ver miembros
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-9 sm:py-12">
        <PerfilPublico data={perfil} />
      </main>

      <SiteFooter />
    </>
  );
}
