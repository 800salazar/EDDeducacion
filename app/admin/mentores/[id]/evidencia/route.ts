import { esAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_MENTORES, esUUID, semanaValida } from "@/lib/mentores";

const headersPrivados = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Vary": "Cookie" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // No se entregan URLs públicas ni firmadas que sigan sirviendo al cerrar sesión.
  if (!(await esAdmin())) return new Response("No autorizado", { status: 401, headers: headersPrivados });
  const { id } = await params;
  const semana = Number(new URL(request.url).searchParams.get("semana"));
  if (!esUUID(id) || !semanaValida(semana)) return new Response("No encontrado", { status: 404, headers: headersPrivados });
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("mentorias_semanas")
    .select("evidencia_path").eq("mentoria_id", id).eq("semana", semana).maybeSingle();
  if (error) return new Response("No se pudo cargar la evidencia", { status: 503, headers: headersPrivados });
  if (!data?.evidencia_path?.startsWith(`${id}/${semana}/`)) return new Response("No encontrado", { status: 404, headers: headersPrivados });
  const { data: imagen, error: errorImagen } = await supabase.storage.from(BUCKET_MENTORES).download(data.evidencia_path);
  if (errorImagen || !imagen) return new Response("No encontrado", { status: 404, headers: headersPrivados });
  return new Response(imagen, { headers: {
    ...headersPrivados, "Content-Type": imagen.type, "Content-Disposition": "inline",
  } });
}
