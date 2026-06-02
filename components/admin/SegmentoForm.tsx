import type { Segmento } from "@/lib/types";
import { parseIdeasClave } from "@/lib/ideas-clave";
import { IdeasClaveInputs } from "@/components/admin/IdeasClaveInputs";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

// Formulario para crear/editar un segmento. `action` es un Server Action.
export function SegmentoForm({
  action,
  segmento,
}: {
  action: (formData: FormData) => void | Promise<void>;
  segmento?: Segmento | null;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const ideasIniciales = construirIdeasIniciales(segmento?.ideas_clave);

  return (
    <form action={action} className="space-y-5">
      {segmento && <input type="hidden" name="id" value={segmento.id} />}
      {segmento && (
        <>
          <input
            type="hidden"
            name="slides_url_actual"
            value={segmento.slides_url ?? ""}
          />
          <input
            type="hidden"
            name="audio_url_actual"
            value={segmento.audio_url ?? ""}
          />
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Título" className="sm:col-span-2">
          <input
            name="titulo"
            required
            defaultValue={segmento?.titulo ?? ""}
            placeholder="Ej. El arte del seguimiento de referrals"
            className={inputCls}
          />
        </Campo>

        <Campo label="Expositor">
          <input
            name="expositor"
            defaultValue={segmento?.expositor ?? ""}
            placeholder="Nombre de quien presentó"
            className={inputCls}
          />
        </Campo>

        <Campo label="Fecha">
          <input
            type="date"
            name="fecha"
            defaultValue={segmento?.fecha ?? hoy}
            className={inputCls}
          />
        </Campo>

        <Campo label="Video (link a YouTube/Vimeo)">
          <input
            name="video_url"
            type="url"
            defaultValue={segmento?.video_url ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Campo>
      </div>

      <Campo label="Resumen ejecutivo (pégalo de ChatGPT)">
        <textarea
          name="resumen"
          rows={5}
          defaultValue={segmento?.resumen ?? ""}
          placeholder="El resumen que verán los miembros…"
          className={inputCls}
        />
      </Campo>

      <Campo label="Ideas clave (opcional)">
        <IdeasClaveInputs initialIdeas={ideasIniciales} />
      </Campo>

      <Campo label="Transcript completo (opcional)">
        <textarea
          name="transcript"
          rows={4}
          defaultValue={segmento?.transcript ?? ""}
          placeholder="Transcript generado por IA…"
          className={inputCls}
        />
      </Campo>

      {/* Archivos */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Slides (PDF o imagen)">
          <input
            type="file"
            name="slides_file"
            accept=".pdf,image/*"
            className={inputCls + " file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-1 file:text-ink"}
          />
          {segmento?.slides_url && (
            <ArchivoActual url={segmento.slides_url} etiqueta="slides actuales" />
          )}
        </Campo>

        <Campo label="Audio (mp3, m4a…)">
          <input
            type="file"
            name="audio_file"
            accept="audio/*"
            className={inputCls + " file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-1 file:text-ink"}
          />
          {segmento?.audio_url && (
            <ArchivoActual url={segmento.audio_url} etiqueta="audio actual" />
          )}
        </Campo>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={segmento ? segmento.publicado : true}
          className="size-4 accent-[var(--color-bni)]"
        />
        <span className="text-sm font-medium text-ink">
          Publicado (visible para los miembros)
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-xl bg-bni px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-bni-dark"
        >
          {segmento ? "Guardar cambios" : "Crear segmento"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1.5 block text-sm font-medium text-ink/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function ArchivoActual({ url, etiqueta }: { url: string; etiqueta: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-block text-xs font-medium text-bni underline"
    >
      Ver {etiqueta} (subir uno nuevo lo reemplaza)
    </a>
  );
}

function construirIdeasIniciales(ideasClave: string | null | undefined): string[] {
  const ideas = parseIdeasClave(ideasClave);

  const minCampos = 3;
  if (ideas.length >= minCampos) return ideas;
  return [
    ...ideas,
    ...Array.from({ length: minCampos - ideas.length }, () => ""),
  ];
}
