import { createReadClient } from "@/lib/supabase/server";
import type { Aplicacion, Miembro, Segmento } from "@/lib/types";

// Consultas de SOLO LECTURA usadas por las pantallas públicas.
// Todas filtran por publicado=true (lo no publicado solo se ve en /admin).

export async function getMiembros(soloActivos = true): Promise<Miembro[]> {
  const supabase = createReadClient();
  let query = supabase.from("miembros").select("*");
  if (soloActivos) query = query.eq("activo", true);
  const { data, error } = await query
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) return resolverErrorLectura(error, [], "getMiembros");
  return (data as Miembro[]) ?? [];
}

export async function getSegmentoDeLaSemana(): Promise<Segmento | null> {
  const supabase = createReadClient();
  const { data } = await supabase
    .from("segmentos")
    .select("*")
    .eq("publicado", true)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Segmento) ?? null;
}

export async function getSegmentos(opts?: {
  q?: string;
  tema?: string;
}): Promise<Segmento[]> {
  const supabase = createReadClient();
  let query = supabase.from("segmentos").select("*").eq("publicado", true);

  if (opts?.tema) {
    query = query.eq("tema", opts.tema);
  }
  if (opts?.q) {
    const term = sanitizarBusqueda(opts.q);
    if (term) {
      query = query.or(
        `titulo.ilike.%${term}%,resumen.ilike.%${term}%,expositor.ilike.%${term}%,tema.ilike.%${term}%`
      );
    }
  }

  const { data, error } = await query
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return resolverErrorLectura(error, [], "getSegmentos");
  return (data as Segmento[]) ?? [];
}

export async function getSegmento(id: string): Promise<Segmento | null> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from("segmentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return resolverErrorLectura(error, null, "getSegmento");
  return (data as Segmento) ?? null;
}

/** Lista de temas distintos (para los chips de filtro del historial). */
export async function getTemas(): Promise<string[]> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from("segmentos")
    .select("tema")
    .eq("publicado", true)
    .not("tema", "is", null);
  if (error) return resolverErrorLectura(error, [], "getTemas");
  const temas = new Set<string>();
  for (const row of (data as { tema: string | null }[]) ?? []) {
    if (row.tema) temas.add(row.tema);
  }
  return [...temas].sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Aplicación "cómo aplicarlo a tu negocio" para un miembro.
 * Busca la de su categoría; si no existe, cae en la categoría 'general'.
 */
export async function getAplicacionParaMiembro(
  segmentoId: string,
  categoria: string | null
): Promise<Aplicacion | null> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from("aplicaciones")
    .select("*")
    .eq("segmento_id", segmentoId)
    .in("categoria", categoria ? [categoria, "general"] : ["general"]);
  if (error) return resolverErrorLectura(error, null, "getAplicacionParaMiembro");

  const lista = (data as Aplicacion[]) ?? [];
  if (lista.length === 0) return null;
  // Prioriza la específica sobre la 'general'.
  return (
    lista.find((a) => a.categoria === categoria) ??
    lista.find((a) => a.categoria === "general") ??
    null
  );
}

/** Todas las aplicaciones de un segmento (para el panel admin). */
export async function getAplicaciones(segmentoId: string): Promise<Aplicacion[]> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from("aplicaciones")
    .select("*")
    .eq("segmento_id", segmentoId)
    .order("categoria", { ascending: true });
  if (error) return resolverErrorLectura(error, [], "getAplicaciones");
  return (data as Aplicacion[]) ?? [];
}

// Quita caracteres que rompen el filtro .or() de PostgREST.
function sanitizarBusqueda(q: string): string {
  return q.replace(/[,()%]/g, " ").trim().slice(0, 80);
}

type SupabaseErrorMin = {
  code?: string;
  message?: string;
};

function resolverErrorLectura<T>(
  error: SupabaseErrorMin,
  fallback: T,
  contexto: string
): T {
  if (esErrorEsquemaNoInicializado(error)) {
    console.warn(
      `[Supabase setup] ${contexto}: ${error.message ?? "schema no inicializado"}. Ejecuta supabase/schema.sql en tu proyecto de Supabase.`
    );
    return fallback;
  }

  throw error;
}

function esErrorEsquemaNoInicializado(error: SupabaseErrorMin): boolean {
  return error.code === "PGRST205" || error.code === "42P01";
}
