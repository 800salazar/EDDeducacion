"use client";

export default function ErrorMentores({ reset }: { reset: () => void }) {
  return <main className="mx-auto w-full max-w-3xl px-5 py-12">
    <h1 className="text-xl font-bold">No pudimos cargar el programa mentores</h1>
    <p className="mt-3 text-sm text-ink/60">Intenta nuevamente. Si es la primera vez que abres esta sección, verifica que se haya completado su configuración en la base de datos.</p>
    <button onClick={reset} className="mt-5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Reintentar</button>
  </main>;
}
