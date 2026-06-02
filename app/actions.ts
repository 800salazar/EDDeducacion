"use server";

import { redirect } from "next/navigation";
import {
  limpiarMiembroSeleccionado,
  setMiembroSeleccionado,
} from "@/lib/sesion-miembro";

// Acciones del portal público (no requieren login).

export async function entrarComoMiembro(formData: FormData) {
  const id = String(formData.get("miembro_id") ?? "").trim();
  if (!id) {
    redirect("/?error=elige");
  }
  await setMiembroSeleccionado(id);
  redirect("/inicio");
}

export async function cambiarMiembro() {
  await limpiarMiembroSeleccionado();
  redirect("/");
}
