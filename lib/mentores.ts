// Constantes y tipos compartidos; este archivo no contiene consultas privadas.
export const SEMANAS_MENTORIA = [1, 2, 3, 4, 5, 6, 7] as const;
export const MAX_EVIDENCIA_BYTES = 3 * 1024 * 1024;
export const BUCKET_MENTORES = "mentores-evidencias";

export type SemanaMentoria = {
  mentoria_id: string;
  semana: number;
  completada: boolean;
  notas: string | null;
  evidencia_path: string | null;
  updated_at: string;
};

export type MiembroMentoria = { id: string; nombre: string; activo: boolean };

export type Mentoria = {
  id: string;
  mentor_id: string;
  mentoreado_id: string;
  created_at: string;
  mentor: MiembroMentoria;
  mentoreado: MiembroMentoria;
  semanas: SemanaMentoria[];
};

export type EstadoMentoria = { error?: string; mensaje?: string; version?: string };

export function esUUID(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function semanaValida(semana: number): boolean {
  return Number.isInteger(semana) && semana >= 1 && semana <= 7;
}
