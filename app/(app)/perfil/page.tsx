import { redirect } from "next/navigation";
import { PerfilEditor } from "@/components/PerfilEditor";
import { getListasDePerfil, getPerfilDeMiembro } from "@/lib/profile-data";
import { getMiembroActual } from "@/lib/sesion-miembro";

export default async function MiPerfilPage() {
  const miembro = await getMiembroActual();
  if (!miembro) redirect("/");

  const perfil = await getPerfilDeMiembro(miembro.id);
  if (!perfil) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>
        <p className="mt-2 text-sm text-ink/55">
          El perfil aún no está disponible. Ejecuta el esquema actualizado de
          Supabase para crear los perfiles del capítulo.
        </p>
      </main>
    );
  }

  const listas = await getListasDePerfil(perfil.id);
  return (
    <main className="flex-1">
      <PerfilEditor miembro={miembro} perfil={perfil} listas={listas} />
    </main>
  );
}
