"use server";

import { revalidatePath } from "next/cache";
import {
  CAMPOS_PERFIL_LIMITES,
  CAMPOS_PERFIL_URL,
  TIPOS_LISTA_PERFIL,
  USUARIOS_RESERVADOS,
  type CampoPerfilEditable,
} from "@/lib/perfil-config";
import { getMiembroActual } from "@/lib/sesion-miembro";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PerfilListaTipo, PerfilMiembro } from "@/lib/types";

const BUCKET = "media";
const CARPETA_FOTOS = "perfiles";
const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const TIPOS_FOTO = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ResultadoPerfil =
  | { ok: true; valor?: string; fotoUrl?: string }
  | { ok: false; error: string };

export async function actualizarCampoPerfil(
  campo: CampoPerfilEditable,
  valor: string
): Promise<ResultadoPerfil> {
  if (!Object.hasOwn(CAMPOS_PERFIL_LIMITES, campo)) {
    return { ok: false, error: "Campo de perfil no válido." };
  }

  const limpio = valor.trim();
  const limite = CAMPOS_PERFIL_LIMITES[campo];
  if (limpio.length > limite) {
    return { ok: false, error: `Este campo permite hasta ${limite} caracteres.` };
  }
  if (CAMPOS_PERFIL_URL.includes(campo) && limpio && !esUrlWeb(limpio)) {
    return { ok: false, error: "Usa una liga válida que inicie con http:// o https://." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const { error } = await contexto.supabase
    .from("perfiles_miembro")
    .update({ [campo]: limpio || null, updated_at: new Date().toISOString() })
    .eq("id", contexto.perfil.id);

  if (error) return { ok: false, error: error.message };
  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true, valor: limpio };
}

export async function actualizarUsuarioPerfil(
  valor: string
): Promise<ResultadoPerfil> {
  const usuario = normalizarUsuario(valor);
  if (usuario.length < 3) {
    return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
  }
  if (usuario.length > 60) {
    return { ok: false, error: "El usuario puede tener hasta 60 caracteres." };
  }
  if (USUARIOS_RESERVADOS.has(usuario)) {
    return { ok: false, error: "Ese usuario está reservado." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;
  if (usuario === contexto.perfil.usuario) return { ok: true, valor: usuario };

  const { data: ocupado, error: errorConsulta } = await contexto.supabase
    .from("perfiles_miembro")
    .select("id")
    .eq("usuario", usuario)
    .neq("id", contexto.perfil.id)
    .maybeSingle();
  if (errorConsulta) return { ok: false, error: errorConsulta.message };
  if (ocupado) return { ok: false, error: "Ese usuario ya está en uso." };

  const anterior = contexto.perfil.usuario;
  const { error } = await contexto.supabase
    .from("perfiles_miembro")
    .update({ usuario, updated_at: new Date().toISOString() })
    .eq("id", contexto.perfil.id);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ese usuario ya está en uso." };
    }
    return { ok: false, error: error.message };
  }

  refrescarPerfil(anterior, usuario);
  return { ok: true, valor: usuario };
}

export async function actualizarColorPrincipal(
  valor: string | null
): Promise<ResultadoPerfil> {
  const color = valor?.trim() || null;
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: "Elige un color válido." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const { error } = await contexto.supabase
    .from("perfiles_miembro")
    .update({ color_principal: color, updated_at: new Date().toISOString() })
    .eq("id", contexto.perfil.id);
  if (error) return { ok: false, error: error.message };

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true, valor: color ?? undefined };
}

export async function actualizarListaPerfil(
  tipo: PerfilListaTipo,
  items: string[]
): Promise<ResultadoPerfil> {
  if (!TIPOS_LISTA_PERFIL.includes(tipo)) {
    return { ok: false, error: "Lista de perfil no válida." };
  }

  const limpios = items.map((item) => item.trim()).filter(Boolean);
  if (limpios.some((item) => item.length > 180)) {
    return { ok: false, error: "Cada elemento permite hasta 180 caracteres." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const { error: deleteError } = await contexto.supabase
    .from("perfil_lista_items")
    .delete()
    .eq("perfil_id", contexto.perfil.id)
    .eq("tipo", tipo);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (limpios.length > 0) {
    const { error: insertError } = await contexto.supabase
      .from("perfil_lista_items")
      .insert(
        limpios.map((contenido, orden) => ({
          perfil_id: contexto.perfil.id,
          tipo,
          contenido,
          orden,
        }))
      );
    if (insertError) return { ok: false, error: insertError.message };
  }

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true };
}

export async function subirFotoPerfil(
  formData: FormData
): Promise<ResultadoPerfil> {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una foto." };
  }
  if (file.size > MAX_FOTO_BYTES) {
    return { ok: false, error: "La foto debe pesar menos de 2 MB." };
  }
  if (!TIPOS_FOTO.has(file.type)) {
    return { ok: false, error: "Usa una imagen JPG, PNG o WebP." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const ext = extensionDeFoto(file.type);
  const storagePath = `${CARPETA_FOTOS}/${contexto.miembro.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await contexto.supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = contexto.supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const fotoUrl = data.publicUrl;
  const { error: updateError } = await contexto.supabase
    .from("perfiles_miembro")
    .update({
      foto_url: fotoUrl,
      foto_storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contexto.perfil.id);

  if (updateError) {
    await contexto.supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: updateError.message };
  }

  if (contexto.perfil.foto_storage_path) {
    await contexto.supabase.storage
      .from(BUCKET)
      .remove([contexto.perfil.foto_storage_path]);
  }

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true, fotoUrl };
}

export async function eliminarFotoPerfil(): Promise<ResultadoPerfil> {
  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const { error } = await contexto.supabase
    .from("perfiles_miembro")
    .update({
      foto_url: null,
      foto_storage_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contexto.perfil.id);
  if (error) return { ok: false, error: error.message };

  if (contexto.perfil.foto_storage_path) {
    await contexto.supabase.storage
      .from(BUCKET)
      .remove([contexto.perfil.foto_storage_path]);
  }

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true };
}

export async function subirLogoEmpresa(
  formData: FormData
): Promise<ResultadoPerfil> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un logo." };
  }
  if (file.size > MAX_FOTO_BYTES) {
    return { ok: false, error: "El logo debe pesar menos de 2 MB." };
  }
  if (!TIPOS_FOTO.has(file.type)) {
    return { ok: false, error: "Usa una imagen JPG, PNG o WebP." };
  }

  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const ext = extensionDeFoto(file.type);
  const storagePath = `${CARPETA_FOTOS}/${contexto.miembro.id}/logo-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await contexto.supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = contexto.supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const logoUrl = data.publicUrl;
  const { error: updateError } = await contexto.supabase
    .from("perfiles_miembro")
    .update({
      logo_empresa_url: logoUrl,
      logo_empresa_storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contexto.perfil.id);

  if (updateError) {
    await contexto.supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: updateError.message };
  }

  if (contexto.perfil.logo_empresa_storage_path) {
    await contexto.supabase.storage
      .from(BUCKET)
      .remove([contexto.perfil.logo_empresa_storage_path]);
  }

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true, fotoUrl: logoUrl };
}

export async function eliminarLogoEmpresa(): Promise<ResultadoPerfil> {
  const contexto = await perfilActual();
  if (!contexto.ok) return contexto;

  const { error } = await contexto.supabase
    .from("perfiles_miembro")
    .update({
      logo_empresa_url: null,
      logo_empresa_storage_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contexto.perfil.id);
  if (error) return { ok: false, error: error.message };

  if (contexto.perfil.logo_empresa_storage_path) {
    await contexto.supabase.storage
      .from(BUCKET)
      .remove([contexto.perfil.logo_empresa_storage_path]);
  }

  refrescarPerfil(contexto.perfil.usuario);
  return { ok: true };
}

type ContextoPerfil =
  | {
      ok: true;
      miembro: NonNullable<Awaited<ReturnType<typeof getMiembroActual>>>;
      perfil: PerfilMiembro;
      supabase: ReturnType<typeof createAdminClient>;
    }
  | { ok: false; error: string };

async function perfilActual(): Promise<ContextoPerfil> {
  const miembro = await getMiembroActual();
  if (!miembro) return { ok: false, error: "Primero elige tu nombre." };

  const supabase = createAdminClient();
  const { data: existente, error: readError } = await supabase
    .from("perfiles_miembro")
    .select("*")
    .eq("miembro_id", miembro.id)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };

  if (existente) {
    return { ok: true, miembro, perfil: existente as PerfilMiembro, supabase };
  }

  const usuario = `${normalizarUsuario(miembro.nombre) || "miembro"}-${miembro.id.replaceAll("-", "").slice(0, 6)}`;
  const { data: nuevo, error: insertError } = await supabase
    .from("perfiles_miembro")
    .insert({ miembro_id: miembro.id, usuario })
    .select("*")
    .single();
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true, miembro, perfil: nuevo as PerfilMiembro, supabase };
}

function refrescarPerfil(anterior: string, actual = anterior) {
  revalidatePath("/perfil");
  revalidatePath("/invitados");
  revalidatePath(`/${anterior}`);
  if (actual !== anterior) revalidatePath(`/${actual}`);
}

function normalizarUsuario(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function esUrlWeb(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function extensionDeFoto(tipo: string): string {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  return "jpg";
}
