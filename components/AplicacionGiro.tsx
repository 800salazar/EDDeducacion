import type { Aplicacion, Miembro } from "@/lib/types";

// El bloque diferenciador: "Cómo aplicarlo a tu negocio".
// Aquí está el verdadero valor de la plataforma.
export function AplicacionGiro({
  miembro,
  aplicacion,
}: {
  miembro: Miembro | null;
  aplicacion: Aplicacion | null;
}) {
  const giro = miembro?.giro;

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
          <p className="text-sm text-ink/55">
            {miembro
              ? "Todavía no hay una aplicación específica para tu giro en este segmento. Pronto la agregamos."
              : "Selecciona tu nombre en el portal para ver acciones personalizadas a tu giro."}
          </p>
        )}
      </div>
    </section>
  );
}
