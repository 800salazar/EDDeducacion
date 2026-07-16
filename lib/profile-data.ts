import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Miembro,
  PerfilListaItem,
  PerfilListaTipo,
  PerfilMiembro,
  PerfilPublico,
} from "@/lib/types";

const TIPOS_LISTA: PerfilListaTipo[] = [
  "clientes_buscados",
  "contactos",
  "mejores_clientes",
];

export async function getPerfilDeMiembro(
  miembroId: string
): Promise<PerfilMiembro | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("perfiles_miembro")
    .select("*")
    .eq("miembro_id", miembroId)
    .maybeSingle();

  if (error) return resolverErrorPerfil(error, null, "getPerfilDeMiembro");
  return (data as PerfilMiembro) ?? null;
}

export async function getPerfilPublicoPorUsuario(
  usuario: string
): Promise<PerfilPublico | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("perfiles_miembro")
    .select("*, miembro:miembros(*)")
    .eq("usuario", usuario)
    .maybeSingle();

  if (error) {
    return resolverErrorPerfil(error, null, "getPerfilPublicoPorUsuario");
  }

  const row = data as
    | (PerfilMiembro & { miembro: Miembro | null })
    | null;
  if (!row?.miembro?.activo) return null;

  const listas = await getListasDePerfil(row.id);
  return {
    miembro: row.miembro,
    perfil: quitarMiembroEmbebido(row),
    listas,
  };
}

export async function getListasDePerfil(
  perfilId: string
): Promise<Record<PerfilListaTipo, PerfilListaItem[]>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("perfil_lista_items")
    .select("*")
    .eq("perfil_id", perfilId)
    .order("tipo", { ascending: true })
    .order("orden", { ascending: true });

  if (error) return resolverErrorPerfil(error, listasVacias(), "getListasDePerfil");

  const listas = listasVacias();
  for (const item of (data as PerfilListaItem[]) ?? []) {
    if (TIPOS_LISTA.includes(item.tipo)) listas[item.tipo].push(item);
  }
  return listas;
}

export async function getCatalogoPerfiles(): Promise<
  Array<Pick<PerfilMiembro, "usuario" | "foto_url"> & { miembro: Miembro }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("perfiles_miembro")
    .select("usuario, foto_url, miembro:miembros!inner(*)")
    .eq("miembro.activo", true);

  if (error) return resolverErrorPerfil(error, [], "getCatalogoPerfiles");

  type CatalogoRow = Pick<PerfilMiembro, "usuario" | "foto_url"> & {
    miembro: Miembro | Miembro[] | null;
  };
  const catalogo = ((data ?? []) as unknown as CatalogoRow[]).flatMap((row) => {
    const miembro = Array.isArray(row.miembro) ? row.miembro[0] : row.miembro;
    return miembro ? [{ usuario: row.usuario, foto_url: row.foto_url, miembro }] : [];
  });

  return catalogo.sort(
    (a, b) =>
      a.miembro.orden - b.miembro.orden ||
      a.miembro.nombre.localeCompare(b.miembro.nombre, "es")
  );
}

function listasVacias(): Record<PerfilListaTipo, PerfilListaItem[]> {
  return {
    clientes_buscados: [],
    contactos: [],
    mejores_clientes: [],
  };
}

function quitarMiembroEmbebido(
  row: PerfilMiembro & { miembro: Miembro | null }
): PerfilMiembro {
  const perfil = { ...row } as PerfilMiembro & { miembro?: Miembro | null };
  delete perfil.miembro;
  return perfil;
}

type SupabaseErrorMin = { code?: string; message?: string };

function resolverErrorPerfil<T>(
  error: SupabaseErrorMin,
  fallback: T,
  contexto: string
): T {
  if (error.code === "PGRST205" || error.code === "42P01") {
    console.warn(
      `[Supabase setup] ${contexto}: ${error.message ?? "schema no inicializado"}. Ejecuta supabase/schema.sql en tu proyecto de Supabase.`
    );
    return fallback;
  }

  throw error;
}
