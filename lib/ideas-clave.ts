export function parseIdeasClave(ideasClave: string | null | undefined): string[] {
  if (!ideasClave) return [];

  const raw = ideasClave.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
    }
  } catch {
    // Si no es JSON, cae a formato legacy en texto por línea.
  }

  return raw
    .split(/\r?\n/)
    .map((linea) => linea.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export function serializarIdeasClave(ideas: string[]): string | null {
  const limpias = ideas.map((idea) => idea.trim()).filter(Boolean);
  if (limpias.length === 0) return null;
  return JSON.stringify(limpias);
}