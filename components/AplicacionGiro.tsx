"use client";

import { useMemo, useState } from "react";
import type { Aplicacion, Miembro, Segmento } from "@/lib/types";

// El bloque diferenciador: "Cómo aplicarlo a tu negocio".
// Aquí está el verdadero valor de la plataforma.
export function AplicacionGiro({
  miembro,
  aplicacion,
  segmento,
}: {
  miembro: Miembro | null;
  aplicacion: Aplicacion | null;
  segmento?: Pick<Segmento, "titulo" | "fecha" | "resumen" | "transcript"> | null;
}) {
  const giro = miembro?.giro;
  const [copiado, setCopiado] = useState(false);

  const promptUltraCorto = useMemo(() => {
    if (!miembro || !segmento) return "";
    return construirPromptUltraCorto({
      nombre: miembro.nombre,
      giro: miembro.giro,
      titulo: segmento.titulo,
      fecha: segmento.fecha,
      resumen: segmento.resumen,
      transcript: segmento.transcript,
    });
  }, [miembro, segmento]);

  async function copiarPrompt() {
    if (!promptUltraCorto) return;
    try {
      await navigator.clipboard.writeText(promptUltraCorto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-bni/15 bg-gradient-to-br from-bni/[0.06] to-transparent">
      <div className="border-b border-bni/10 bg-bni/[0.04] px-5 py-3 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bni">
          Cómo aplicarlo a tu negocio
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-ink">
          {giro ? `Para ${giro}` : "Acciones para tu giro"}
        </h2>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {aplicacion ? (
          <div className="prosa text-[15px] text-ink/85">
            {aplicacion.contenido}
          </div>
        ) : (
          <div className="space-y-3">
            {!miembro && (
              <p className="text-sm text-ink/55">
                Selecciona tu nombre en el portal para ver acciones personalizadas a tu giro.
              </p>
            )}

            {miembro && promptUltraCorto && (
              <div className="rounded-xl border border-bni/20 bg-white/85 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-bni">
                  Prompt para tu Inteligencia Articial Favorita
                </p>
                <p className="text-sm text-ink/70">
                  1. Presiona <span className="font-semibold">Copiar prompt</span>.
                  <br />
                  2. Pega el texto en tu IA favorita (ChatGPT, Gemini, Claude, etc.).
                  <br />
                  3. Obtén ideas accionables para tu giro con base en este segmento.
                </p>
                <button
                  type="button"
                  onClick={copiarPrompt}
                  className="mt-2 rounded-lg bg-bni px-3 py-2 text-xs font-semibold text-white transition hover:bg-bni-dark"
                >
                  {copiado ? "Prompt copiado" : "Copiar prompt"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function construirPromptUltraCorto(data: {
  nombre: string;
  giro: string;
  titulo: string;
  fecha: string;
  resumen: string | null;
  transcript: string | null;
}): string {
  const fuenteBruta = (data.transcript ?? data.resumen ?? data.titulo).trim();
  const fuente = fuenteBruta.length > 3200
    ? `${fuenteBruta.slice(0, 3200)}\n\n[contenido recortado]`
    : fuenteBruta;

  return [
    `Con este contenido:`,
    `${fuente}`,
    `y mi giro: ${data.giro},`,
    `dame 10 acciones concretas para aplicar esta semana, con tiempo estimado y resultado esperado.`,
    `Incluye 3 mensajes listos para enviar a clientes/prospectos.`,
    `Mi nombre es ${data.nombre}.`,
    `Segmento: ${data.titulo} (${data.fecha}).`,
  ].join("\n");
}
