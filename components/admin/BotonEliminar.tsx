"use client";

// Botón de borrado con confirmación. Recibe un Server Action y campos ocultos.
export function BotonEliminar({
  action,
  hidden,
  label = "Eliminar",
  mensaje = "¿Seguro que quieres eliminar esto? No se puede deshacer.",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  label?: string;
  mensaje?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={
          className ??
          "rounded-lg px-3 py-2 text-sm font-medium text-bni transition hover:bg-bni/10"
        }
      >
        {label}
      </button>
    </form>
  );
}
