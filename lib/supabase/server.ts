import { createClient } from "@supabase/supabase-js";

// Cliente de SOLO LECTURA con la anon key.
// Se usa para todo lo que ven los miembros (RLS permite SELECT público).
// No maneja sesiones de usuario: el portal no tiene login.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createReadClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
