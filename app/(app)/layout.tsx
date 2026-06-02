import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getMiembroActual } from "@/lib/sesion-miembro";

// Layout de las pantallas internas: header con el miembro actual + footer.
// No fuerza selección: si llegan por un link compartido sin elegir nombre,
// igual ven el contenido y el header les ofrece "Elegir mi nombre".
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const miembro = await getMiembroActual();
  return (
    <>
      <SiteHeader miembro={miembro} />
      {children}
      <SiteFooter />
    </>
  );
}
