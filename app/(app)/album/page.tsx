import { redirect } from "next/navigation";
import { AlbumMundial } from "@/components/AlbumMundial";
import { getAlbumEstampas } from "@/lib/album-data";
import { getMiembros } from "@/lib/data";
import { getMiembroActual } from "@/lib/sesion-miembro";

export default async function AlbumPage() {
  const miembro = await getMiembroActual();
  if (!miembro) redirect("/");

  const [miembros, estampas] = await Promise.all([
    getMiembros(true),
    getAlbumEstampas(miembro.id),
  ]);
  const objetivos = miembros.filter((m) => m.id !== miembro.id);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:py-10">
      <AlbumMundial
        miembro={miembro}
        objetivos={objetivos}
        estampasIniciales={estampas}
      />
    </main>
  );
}
