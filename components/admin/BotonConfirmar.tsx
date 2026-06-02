"use client";

export function BotonConfirmar({
  label,
  mensaje,
  className,
}: {
  label: string;
  mensaje: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
      className={
        className ??
        "rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
      }
    >
      {label}
    </button>
  );
}
