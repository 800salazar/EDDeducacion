"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMiembroIdSeleccionado } from "@/lib/sesion-miembro";

const BUCKET = "media";
const CARPETA = "album";
const MAX_BYTES = 2 * 1024 * 1024; // La app comprime antes; esto evita subidas enormes.
const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AlbumMutationResult =
  | {
      ok: true;
      objetivoMiembroId: string;
      fotoUrl?: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function guardarEstampaAlbum(
  formData: FormData
): Promise<AlbumMutationResult> {
  const miembroId = await getMiembroIdSeleccionado();
  const objetivoMiembroId = String(
    formData.get("objetivo_miembro_id") ?? ""
  ).trim();
  const file = formData.get("foto");

  if (!miembroId) return { ok: false, error: "Primero elige tu nombre." };
  if (!objetivoMiembroId) return { ok: false, error: "Falta el miembro." };
  if (miembroId === objetivoMiembroId) {
    return { ok: false, error: "No puedes llenar tu propia estampa." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una foto." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "La foto sigue siendo muy pesada." };
  }
  if (!TIPOS_PERMITIDOS.has(file.type)) {
    return { ok: false, error: "Usa una imagen JPG, PNG o WebP." };
  }

  const supabase = createAdminClient();
  const objetivoValido = await existeMiembroActivo(supabase, objetivoMiembroId);
  if (!objetivoValido) {
    return { ok: false, error: "Ese miembro no está activo." };
  }

  const anterior = await getEstampaActual(supabase, miembroId, objetivoMiembroId);
  const ext = extensionDesdeTipo(file.type);
  const storagePath = `${CARPETA}/${miembroId}/${objetivoMiembroId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const fotoUrl = data.publicUrl;

  const { error: upsertError } = await supabase.from("album_estampas").upsert(
    {
      miembro_id: miembroId,
      objetivo_miembro_id: objetivoMiembroId,
      foto_url: fotoUrl,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "miembro_id,objetivo_miembro_id" }
  );

  if (upsertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: upsertError.message };
  }

  if (anterior?.storage_path && anterior.storage_path !== storagePath) {
    await supabase.storage.from(BUCKET).remove([anterior.storage_path]);
  }

  revalidatePath("/album");
  return { ok: true, objetivoMiembroId, fotoUrl };
}

export async function eliminarEstampaAlbum(
  formData: FormData
): Promise<AlbumMutationResult> {
  const miembroId = await getMiembroIdSeleccionado();
  const objetivoMiembroId = String(
    formData.get("objetivo_miembro_id") ?? ""
  ).trim();

  if (!miembroId) return { ok: false, error: "Primero elige tu nombre." };
  if (!objetivoMiembroId) return { ok: false, error: "Falta el miembro." };

  const supabase = createAdminClient();
  const anterior = await getEstampaActual(supabase, miembroId, objetivoMiembroId);

  const { error } = await supabase
    .from("album_estampas")
    .delete()
    .eq("miembro_id", miembroId)
    .eq("objetivo_miembro_id", objetivoMiembroId);

  if (error) return { ok: false, error: error.message };
  if (anterior?.storage_path) {
    await supabase.storage.from(BUCKET).remove([anterior.storage_path]);
  }

  revalidatePath("/album");
  return { ok: true, objetivoMiembroId };
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function existeMiembroActivo(
  supabase: SupabaseAdmin,
  miembroId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("miembros")
    .select("id")
    .eq("id", miembroId)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function getEstampaActual(
  supabase: SupabaseAdmin,
  miembroId: string,
  objetivoMiembroId: string
): Promise<{ storage_path: string } | null> {
  const { data, error } = await supabase
    .from("album_estampas")
    .select("storage_path")
    .eq("miembro_id", miembroId)
    .eq("objetivo_miembro_id", objetivoMiembroId)
    .maybeSingle();

  if (error) throw error;
  return (data as { storage_path: string } | null) ?? null;
}

function extensionDesdeTipo(tipo: string): string {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  return "jpg";
}
