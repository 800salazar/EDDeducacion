import { entrarComoMiembro } from "@/app/actions";
import type { Miembro } from "@/lib/types";

// Selector del portal: el miembro elige su nombre y entra. Sin login.
// Es un <form> nativo (cero JavaScript): funciona aunque no cargue el JS.
export function MiembroSelector({
  miembros,
  error,
}: {
  miembros: Miembro[];
  error?: boolean;
}) {
  return (
    <form action={entrarComoMiembro} className="w-full">
      <label
        htmlFor="miembro_id"
        className="mb-2 block text-sm font-medium text-ink/70"
      >
        ¿Quién eres?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          id="miembro_id"
          name="miembro_id"
          defaultValue=""
          required
          className="h-12 flex-1 rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
        >
          <option value="" disabled>
            Selecciona tu nombre…
          </option>
          {miembros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} — {m.giro}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-12 rounded-xl bg-bni px-7 text-base font-semibold text-white shadow-sm transition hover:bg-bni-dark active:scale-[0.99]"
        >
          Entrar
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-bni">Primero elige tu nombre.</p>
      )}
      {miembros.length === 0 && (
        <p className="mt-3 text-sm text-ink/50">
          Aún no hay miembros cargados. Agrégalos desde el panel{" "}
          <span className="font-medium">/admin</span>.
        </p>
      )}
    </form>
  );
}
