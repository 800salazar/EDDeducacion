import "server-only";
import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { esUUID, type Mentoria, type MiembroMentoria } from "@/lib/mentores";

const SELECCION = `id, mentor_id, mentoreado_id, created_at,
  mentor:miembros!mentorias_mentor_id_fkey(id, nombre, activo),
  mentoreado:miembros!mentorias_mentoreado_id_fkey(id, nombre, activo),
  semanas:mentorias_semanas(mentoria_id, semana, completada, notas, evidencia_path, updated_at)`;
export const PAREJAS_POR_PAGINA = 20;

export async function exigirAdminMentores() {
  if (!(await esAdmin())) redirect("/admin");
}

export async function listarMiembrosMentores(): Promise<MiembroMentoria[]> {
  await exigirAdminMentores();
  const { data, error } = await createAdminClient()
    .from("miembros").select("id, nombre, activo").eq("activo", true).order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function listarMentorias(busqueda: string, pagina: number) {
  await exigirAdminMentores();
  const supabase = createAdminClient();
  let consulta = supabase.from("mentorias").select(SELECCION, { count: "exact" });
  if (busqueda) {
    // La búsqueda pasa por miembros para no interpolar texto en filtros OR.
    const termino = busqueda.replace(/[\\%_]/g, "\\$&");
    const { data, error } = await supabase.from("miembros")
      .select("id").ilike("nombre", `%${termino}%`);
    if (error) throw error;
    if (!data?.length) return { parejas: [], total: 0 };
    const ids = data.map((m) => m.id).join(",");
    consulta = consulta.or(`mentor_id.in.(${ids}),mentoreado_id.in.(${ids})`);
  }
  const inicio = (pagina - 1) * PAREJAS_POR_PAGINA;
  const { data, count, error } = await consulta
    .order("created_at", { ascending: false }).order("id")
    .range(inicio, inicio + PAREJAS_POR_PAGINA - 1);
  if (error) throw error;
  return { parejas: (data ?? []) as unknown as Mentoria[], total: count ?? 0 };
}

export async function obtenerMentoria(id: string): Promise<Mentoria | null> {
  await exigirAdminMentores();
  if (!esUUID(id)) return null;
  const { data, error } = await createAdminClient()
    .from("mentorias").select(SELECCION).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Mentoria | null;
}
