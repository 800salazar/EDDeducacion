"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  cerrarSesionAdmin,
  esAdmin,
  iniciarSesionAdmin,
  passwordValida,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseIdeasClave, serializarIdeasClave } from "@/lib/ideas-clave";

const BUCKET = "media";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// ----------------------------------------------------------------------------
// Sesión admin
// ----------------------------------------------------------------------------
export type LoginState = { error?: string };

export async function loginAdmin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const intento = String(formData.get("password") ?? "");
  if (!passwordValida(intento)) {
    return { error: "Contraseña incorrecta." };
  }
  await iniciarSesionAdmin();
  redirect("/admin");
}

export async function logoutAdmin() {
  await cerrarSesionAdmin();
  redirect("/");
}

// Llamar al inicio de TODA mutación: los Server Actions son POST-accesibles.
async function exigirAdmin() {
  if (!(await esAdmin())) {
    throw new Error("No autorizado");
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function ideasClaveDesdeFormData(formData: FormData): string | null {
  const ideas = formData
    .getAll("ideas_clave_item")
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  if (ideas.length > 0) {
    return serializarIdeasClave(ideas);
  }

  // Compatibilidad con payloads viejos si existiera textarea único.
  return serializarIdeasClave(parseIdeasClave(texto(formData, "ideas_clave")));
}

function categoriaDesdeGiro(giro: string): string {
  return (
    giro
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " y ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "general"
  );
}

function refrescarPublico() {
  revalidatePath("/", "layout");
}

async function subirArchivo(
  file: FormDataEntryValue | null,
  carpeta: string
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error(`El archivo supera el límite de 50 MB (${file.name}).`);
  }
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const nombre = `${carpeta}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nombre, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
  return data.publicUrl;
}

// ----------------------------------------------------------------------------
// Segmentos
// ----------------------------------------------------------------------------
export async function crearSegmento(formData: FormData) {
  await exigirAdmin();
  const supabase = createAdminClient();

  const slidesUrl = await subirArchivo(formData.get("slides_file"), "slides");
  const audioUrl = await subirArchivo(formData.get("audio_file"), "audio");

  const { data, error } = await supabase
    .from("segmentos")
    .insert({
      titulo: texto(formData, "titulo") ?? "Sin título",
      expositor: texto(formData, "expositor"),
      fecha: texto(formData, "fecha") ?? new Date().toISOString().slice(0, 10),
      resumen: texto(formData, "resumen"),
      ideas_clave: ideasClaveDesdeFormData(formData),
      transcript: texto(formData, "transcript"),
      video_url: texto(formData, "video_url"),
      slides_url: slidesUrl,
      audio_url: audioUrl,
      publicado: formData.get("publicado") === "on",
    })
    .select("id")
    .single();
  if (error) throw error;

  refrescarPublico();
  redirect(`/admin/segmentos/${data.id}`);
}

export async function actualizarSegmento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const supabase = createAdminClient();

  const nuevoSlides = await subirArchivo(formData.get("slides_file"), "slides");
  const nuevoAudio = await subirArchivo(formData.get("audio_file"), "audio");

  const { error } = await supabase
    .from("segmentos")
    .update({
      titulo: texto(formData, "titulo") ?? "Sin título",
      expositor: texto(formData, "expositor"),
      fecha: texto(formData, "fecha") ?? new Date().toISOString().slice(0, 10),
      resumen: texto(formData, "resumen"),
      ideas_clave: ideasClaveDesdeFormData(formData),
      transcript: texto(formData, "transcript"),
      video_url: texto(formData, "video_url"),
      // Si subió archivo nuevo, reemplaza; si no, conserva el actual.
      slides_url: nuevoSlides ?? texto(formData, "slides_url_actual"),
      audio_url: nuevoAudio ?? texto(formData, "audio_url_actual"),
      publicado: formData.get("publicado") === "on",
    })
    .eq("id", id);
  if (error) throw error;

  refrescarPublico();
  redirect(`/admin/segmentos/${id}?ok=1`);
}

export async function eliminarSegmento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const supabase = createAdminClient();
  const { error } = await supabase.from("segmentos").delete().eq("id", id);
  if (error) throw error;

  refrescarPublico();
  redirect("/admin");
}

// ----------------------------------------------------------------------------
// Aplicaciones (cómo aplicarlo por giro)
// ----------------------------------------------------------------------------
export async function guardarAplicacion(formData: FormData) {
  await exigirAdmin();
  const segmentoId = String(formData.get("segmento_id") ?? "");
  const categoria = String(formData.get("categoria") ?? "").trim().toLowerCase();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!segmentoId || !categoria || !contenido) {
    throw new Error("Faltan datos de la aplicación");
  }

  const supabase = createAdminClient();
  // upsert por (segmento_id, categoria)
  const { error } = await supabase
    .from("aplicaciones")
    .upsert(
      { segmento_id: segmentoId, categoria, contenido },
      { onConflict: "segmento_id,categoria" }
    );
  if (error) throw error;

  refrescarPublico();
  redirect(`/admin/segmentos/${segmentoId}?ok=1`);
}

export async function eliminarAplicacion(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const segmentoId = String(formData.get("segmento_id") ?? "");
  if (!id) throw new Error("Falta id");
  const supabase = createAdminClient();
  const { error } = await supabase.from("aplicaciones").delete().eq("id", id);
  if (error) throw error;

  refrescarPublico();
  redirect(`/admin/segmentos/${segmentoId}`);
}

// ----------------------------------------------------------------------------
// Miembros
// ----------------------------------------------------------------------------
export async function crearMiembro(formData: FormData) {
  await exigirAdmin();
  const supabase = createAdminClient();

  const nombre = texto(formData, "nombre") ?? "Sin nombre";
  const giro = texto(formData, "giro") ?? "General";

  const { data: ultimo, error: errorOrden } = await supabase
    .from("miembros")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errorOrden) throw errorOrden;

  const siguienteOrden = ((ultimo as { orden?: number } | null)?.orden ?? 0) + 1;

  const { error } = await supabase.from("miembros").insert({
    nombre,
    empresa: null,
    giro,
    categoria: categoriaDesdeGiro(giro),
    orden: siguienteOrden,
    activo: true,
  });
  if (error) throw error;

  refrescarPublico();
  redirect("/admin/miembros");
}

export async function actualizarMiembro(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const supabase = createAdminClient();

  const nombre = texto(formData, "nombre") ?? "Sin nombre";
  const giro = texto(formData, "giro") ?? "General";

  const { error } = await supabase
    .from("miembros")
    .update({
      nombre,
      giro,
      categoria: categoriaDesdeGiro(giro),
    })
    .eq("id", id);
  if (error) throw error;

  refrescarPublico();
  redirect("/admin/miembros");
}

export async function eliminarMiembro(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta id");
  const supabase = createAdminClient();
  const { error } = await supabase.from("miembros").delete().eq("id", id);
  if (error) throw error;

  refrescarPublico();
  redirect("/admin/miembros");
}
