import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

// Autenticación mínima para UN solo admin (tú).
// No hay tabla de usuarios: solo una contraseña en ADMIN_PASSWORD.
// Al entrar, guardamos una cookie httpOnly con un token derivado de la
// contraseña (no la contraseña en claro). En cada request al panel
// comparamos la cookie contra ese token.

const COOKIE = "edd_admin";

function expectedToken(): string {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) {
    throw new Error("Falta ADMIN_PASSWORD en .env.local");
  }
  // Token determinista derivado de la contraseña.
  return createHash("sha256").update(`bni-edd::${pass}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** ¿La contraseña enviada en el formulario es correcta? */
export function passwordValida(intento: string): boolean {
  const pass = process.env.ADMIN_PASSWORD ?? "";
  return safeEqual(intento, pass) && pass.length > 0;
}

/** ¿El request actual viene de un admin autenticado? */
export async function esAdmin(): Promise<boolean> {
  const store = await cookies();
  const valor = store.get(COOKIE)?.value;
  if (!valor) return false;
  return safeEqual(valor, expectedToken());
}

/** Inicia sesión de admin (setea la cookie). Llamar tras validar la contraseña. */
export async function iniciarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

/** Cierra sesión de admin. */
export async function cerrarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
