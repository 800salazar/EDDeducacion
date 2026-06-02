import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Aplicacion, Miembro, Segmento } from "@/lib/types";

// Lecturas para el panel admin. Usan service_role: ven TODO, incluso los
// segmentos NO publicados (borradores).

export async function listarSegmentosAdmin(): Promise<Segmento[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("segmentos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as Segmento[]) ?? [];
}

export async function getSegmentoAdmin(id: string): Promise<Segmento | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("segmentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Segmento) ?? null;
}

export async function listarAplicacionesAdmin(
  segmentoId: string
): Promise<Aplicacion[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("aplicaciones")
    .select("*")
    .eq("segmento_id", segmentoId)
    .order("categoria", { ascending: true });
  return (data as Aplicacion[]) ?? [];
}

export async function listarMiembrosAdmin(): Promise<Miembro[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("miembros")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  return (data as Miembro[]) ?? [];
}

/** Categorías existentes entre los miembros (para sugerir al crear aplicaciones). */
export async function listarCategorias(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("miembros").select("categoria");
  const set = new Set<string>();
  for (const row of (data as { categoria: string }[]) ?? []) {
    if (row.categoria) set.add(row.categoria);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}
