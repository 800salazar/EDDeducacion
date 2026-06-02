export function SiteFooter() {
  return (
    <footer className="mt-auto bg-bni text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:text-left">
        <span className="grid place-items-center rounded-md bg-white px-2 py-1 text-sm font-extrabold tracking-tight text-bni shadow-sm">
          BNI
        </span>
        <p className="text-sm font-medium text-white/95 sm:text-base">
          tecnologia de{" "}
          <a
            href="https://salazarconsulotres.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            SalazarConsulotres.com
          </a>
        </p>
      </div>
    </footer>
  );
}
