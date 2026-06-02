// Formateo de fechas en español (es-MX). Recibe "YYYY-MM-DD" o ISO.

export function fechaLarga(fecha: string): string {
  const d = parseFecha(fecha);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fechaCorta(fecha: string): string {
  const d = parseFecha(fecha);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Interpreta "YYYY-MM-DD" como fecha local (evita el corrimiento de zona horaria
// que ocurre cuando JS asume UTC para fechas sin hora).
function parseFecha(fecha: string): Date {
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  if (soloFecha) {
    const [y, m, d] = fecha.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(fecha);
}
