import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { esAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/app/admin/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await esAdmin())) {
    return <LoginScreen />;
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Logo compact />
            </Link>
            <span className="hidden rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-semibold text-ink/60 sm:inline">
              Panel
            </span>
          </div>

          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
            >
              Segmentos
            </Link>
            <Link
              href="/admin/miembros"
              className="rounded-lg px-3 py-2 font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
            >
              Miembros
            </Link>
            <Link
              href="/inicio"
              className="hidden rounded-lg px-3 py-2 font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink sm:inline"
            >
              Ver sitio
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-lg border border-black/10 px-3 py-2 font-medium text-ink/70 transition hover:border-black/20"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
