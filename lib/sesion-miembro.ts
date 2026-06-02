import "server-only";
import { cookies } from "next/headers";
import { createReadClient } from "@/lib/supabase/server";
import type { Miembro } from "@/lib/types";

// "Sesión" del miembro SIN login: solo guardamos su id en una cookie cuando
// elige su nombre en el portal. Sirve para personalizar "cómo aplicarlo".

const COOKIE = "edd_miembro";

export async function setMiembroSeleccionado(id: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: false, // no es secreto; solo recuerda quién eligió ser
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 6 meses
  });
}

export async function limpiarMiembroSeleccionado(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getMiembroIdSeleccionado(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

/** Devuelve el miembro actualmente seleccionado, o null si no hay/no existe. */
export async function getMiembroActual(): Promise<Miembro | null> {
  const id = await getMiembroIdSeleccionado();
  if (!id) return null;
  const supabase = createReadClient();
  const { data } = await supabase
    .from("miembros")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Miembro) ?? null;
}
