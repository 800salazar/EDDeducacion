import type { Segmento } from "@/lib/types";

// Muestra los medios disponibles del segmento: slides (PDF/imagen), audio y video.
export function SegmentoMedia({
  segmento,
  embed = false,
}: {
  segmento: Segmento;
  embed?: boolean;
}) {
  const { slides_url, audio_url, video_url } = segmento;
  if (!slides_url && !audio_url && !video_url) return null;

  const esImagen = slides_url ? /\.(png|jpe?g|webp|gif)$/i.test(slides_url) : false;
  const esPdf = slides_url ? /\.pdf($|\?)/i.test(slides_url) : false;

  return (
    <div className="flex flex-col gap-4">
      {/* Slides: vista incrustada (solo en detalle) o botón */}
      {slides_url && embed && esImagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slides_url}
          alt={`Slides de ${segmento.titulo}`}
          className="w-full rounded-xl border border-black/5"
        />
      )}
      {slides_url && embed && esPdf && (
        <iframe
          src={slides_url}
          title={`Slides de ${segmento.titulo}`}
          className="h-[28rem] w-full rounded-xl border border-black/5 bg-white"
        />
      )}

      {audio_url && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/45">
            Audio del segmento
          </p>
          <audio controls preload="none" src={audio_url} className="w-full">
            Tu navegador no soporta audio.
          </audio>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        {slides_url && (
          <a
            href={slides_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-bni/40 hover:text-bni-dark"
          >
            📄 {esImagen ? "Ver imagen/slides" : "Ver slides (PDF)"}
          </a>
        )}
        {video_url && (
          <a
            href={video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-bni/40 hover:text-bni-dark"
          >
            ▶ Ver video
          </a>
        )}
      </div>
    </div>
  );
}
