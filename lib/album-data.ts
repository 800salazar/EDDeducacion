import { createReadClient } from "@/lib/supabase/server";
import type { AlbumEstampa } from "@/lib/types";

export async function getAlbumEstampas(
  miembroId: string
): Promise<AlbumEstampa[]> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from("album_estampas")
    .select("*")
    .eq("miembro_id", miembroId);

  if (error) return resolverErrorLectura(error, [], "getAlbumEstampas");
  return (data as AlbumEstampa[]) ?? [];
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
  if (error.code === "PGRST205" || error.code === "42P01") {
    console.warn(
      `[Supabase setup] ${contexto}: ${error.message ?? "schema no inicializado"}. Ejecuta supabase/schema.sql en tu proyecto de Supabase.`
    );
    return fallback;
  }

  throw error;
}
