"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BUCKET_MENTORES, MAX_EVIDENCIA_BYTES, esUUID, semanaValida, type EstadoMentoria,
} from "@/lib/mentores";

function refrescar(id?: string) {
  revalidatePath("/admin/mentores");
  if (id) revalidatePath(`/admin/mentores/${id}`);
}

export async function crearMentoria(
  _estado: EstadoMentoria, form: FormData,
): Promise<EstadoMentoria> {
  if (!(await esAdmin())) return { error: "Tu sesión venció. Vuelve a entrar como administrador." };
  const mentor = String(form.get("mentor_id") ?? "");
  const mentoreado = String(form.get("mentoreado_id") ?? "");
  if (!esUUID(mentor) || !esUUID(mentoreado)) return { error: "Selecciona ambos miembros." };
  if (mentor === mentoreado) return { error: "El mentor y el mentoreado deben ser personas distintas." };
  const supabase = createAdminClient();
  const { data: miembros, error: errorMiembros } = await supabase.from("miembros")
    .select("id").in("id", [mentor, mentoreado]).eq("activo", true);
  if (errorMiembros || miembros?.length !== 2) return { error: "Selecciona dos miembros activos del listado actual." };
  const { data, error } = await supabase.from("mentorias")
    .insert({ mentor_id: mentor, mentoreado_id: mentoreado }).select("id").single();
  if (error) {
    if (error.code === "23505") return { error: "Esta pareja ya está registrada." };
    console.error("crearMentoria", error.code);
    return { error: "No se pudo crear la pareja. Intenta nuevamente." };
  }
  refrescar();
  redirect(`/admin/mentores/${data.id}`);
}

export async function marcarSemana(id: string, semana: number, completada: boolean): Promise<EstadoMentoria> {
  if (!(await esAdmin())) return { error: "Tu sesión venció. Vuelve a entrar como administrador." };
  if (!esUUID(id) || !semanaValida(semana) || typeof completada !== "boolean") return { error: "Semana inválida." };
  const { data, error } = await createAdminClient().from("mentorias_semanas")
    .update({ completada, updated_at: new Date().toISOString() })
    .eq("mentoria_id", id).eq("semana", semana).select("semana").maybeSingle();
  if (error || !data) return { error: "No se pudo guardar el cambio. Recarga e intenta nuevamente." };
  refrescar(id);
  return { mensaje: "Guardado." };
}

async function limpiarImagen(ruta: string) {
  const { error } = await createAdminClient().storage.from(BUCKET_MENTORES).remove([ruta]);
  if (error) console.error("No se pudo limpiar evidencia de mentoría", error.message);
}

function tipoImagen(buffer: Buffer): { tipo: string; ext: string } | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { tipo: "image/jpeg", ext: "jpg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { tipo: "image/png", ext: "png" };
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { tipo: "image/webp", ext: "webp" };
  return null;
}

export async function guardarSemana(
  _estado: EstadoMentoria, form: FormData,
): Promise<EstadoMentoria> {
  if (!(await esAdmin())) return { error: "Tu sesión venció. Vuelve a entrar como administrador." };
  const id = String(form.get("mentoria_id") ?? "");
  const semana = Number(form.get("semana"));
  const version = String(form.get("version") ?? "");
  const notas = String(form.get("notas") ?? "").trim();
  if (!esUUID(id) || !semanaValida(semana) || !version) return { error: "Registro inválido." };
  if (notas.length > 5000) return { error: "Las notas admiten hasta 5,000 caracteres." };
  const archivo = form.get("evidencia");
  const file = archivo instanceof File && archivo.size > 0 ? archivo : null;
  if (file && file.size > MAX_EVIDENCIA_BYTES) return { error: "La imagen debe pesar como máximo 3 MB." };
  const supabase = createAdminClient();
  const { data: anterior, error: errorLectura } = await supabase.from("mentorias_semanas")
    .select("evidencia_path, updated_at").eq("mentoria_id", id).eq("semana", semana).maybeSingle();
  if (errorLectura || !anterior) return { error: "No se encontró la semana. Recarga la página." };
  if (anterior.updated_at !== version) return { error: "Esta semana cambió en otra ventana. Recarga antes de guardar." };
  let nuevaRuta: string | null = null;
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const formato = tipoImagen(buffer);
    if (!formato || formato.tipo !== file.type) return { error: "Utiliza una imagen JPG, PNG o WebP válida." };
    nuevaRuta = `${id}/${semana}/${crypto.randomUUID()}.${formato.ext}`;
    const { error } = await supabase.storage.from(BUCKET_MENTORES)
      .upload(nuevaRuta, buffer, { contentType: formato.tipo, upsert: false });
    if (error) return { error: "No se pudo subir la imagen. Tus cambios no se han guardado." };
  }
  const ruta = nuevaRuta ?? (form.get("quitar_evidencia") === "on" ? null : anterior.evidencia_path);
  const { data, error } = await supabase.from("mentorias_semanas").update({
    completada: form.get("completada") === "on", notas: notas || null,
    evidencia_path: ruta, updated_at: new Date().toISOString(),
  }).eq("mentoria_id", id).eq("semana", semana).eq("updated_at", version)
    .select("semana, updated_at").maybeSingle();
  if (error || !data) {
    if (nuevaRuta) await limpiarImagen(nuevaRuta);
    return { error: "No se pudo guardar. Recarga para revisar si hubo cambios en otra ventana." };
  }
  if (anterior.evidencia_path && anterior.evidencia_path !== ruta) await limpiarImagen(anterior.evidencia_path);
  refrescar(id);
  return { mensaje: `Semana ${semana} guardada.`, version: data.updated_at };
}

export async function eliminarMentoria(_estado: EstadoMentoria, form: FormData): Promise<EstadoMentoria> {
  if (!(await esAdmin())) return { error: "Tu sesión venció. Vuelve a entrar como administrador." };
  const id = String(form.get("id") ?? "");
  if (!esUUID(id)) return { error: "Pareja inválida." };
  const supabase = createAdminClient();
  const { data: semanas, error: errorLectura } = await supabase.from("mentorias_semanas")
    .select("evidencia_path").eq("mentoria_id", id);
  if (errorLectura) return { error: "No se pudo eliminar la pareja." };
  const { error } = await supabase.from("mentorias").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la pareja." };
  await Promise.all((semanas ?? []).flatMap((s) => s.evidencia_path ? [limpiarImagen(s.evidencia_path)] : []));
  refrescar();
  redirect("/admin/mentores");
}
