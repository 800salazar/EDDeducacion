import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con SERVICE ROLE: ignora RLS y puede escribir/subir archivos.
// SOLO debe usarse en el servidor (Server Actions / Route Handlers del panel).
// El import "server-only" hace que el build falle si alguien lo importa
// accidentalmente en un componente de cliente.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
