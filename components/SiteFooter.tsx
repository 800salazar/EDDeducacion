export function SiteFooter() {
  return (
    <footer className="mt-auto bg-bni text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:text-left">
        <span className="inline-flex items-center gap-2 text-sm font-extrabold tracking-tight text-white">
          <span className="size-3 rounded-full bg-white/90" aria-hidden />
          Educación
        </span>
        <p className="text-sm font-medium text-white/95 sm:text-base">
          Desarrollado por {" "}
          <a
            href="https://SalazarConsultores.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            SalazarConsultores.com
          </a>
        </p>
      </div>
    </footer>
  );
}
