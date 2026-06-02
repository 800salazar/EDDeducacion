import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:text-left">
        <Logo compact />
        <p className="text-xs text-ink/50">
          Aprendizaje práctico semanal para aplicar en tu negocio.
        </p>
      </div>
    </footer>
  );
}
