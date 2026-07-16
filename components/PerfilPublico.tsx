/* eslint-disable @next/next/no-img-element -- foto pública con URL dinámica de Storage */
import type { PerfilListaItem, PerfilPublico as PerfilPublicoData } from "@/lib/types";

export function PerfilPublico({ data }: { data: PerfilPublicoData }) {
  const { miembro, perfil, listas } = data;
  const usaLinkExterno = Boolean(perfil.link_formato_uno_a_uno);
  const colorPrincipal = perfil.color_principal ?? "#6b7280";

  return (
    <article className="mx-auto w-full max-w-4xl">
      <header className="border-b border-black/10 pb-8 text-center">
        <div
          className="mx-auto grid size-32 place-items-center overflow-hidden rounded-2xl text-3xl font-bold text-white shadow-sm"
          style={{ backgroundColor: colorPrincipal }}
        >
          {perfil.foto_url ? (
            <img src={perfil.foto_url} alt={`Foto de ${miembro.nombre}`} className="size-full object-cover" />
          ) : (
            iniciales(miembro.nombre)
          )}
        </div>
        {perfil.logo_empresa_url && (
          <div className="mx-auto mt-4 flex h-16 max-w-48 items-center justify-center">
            <img
              src={perfil.logo_empresa_url}
              alt={`Logo de ${miembro.empresa ?? miembro.nombre}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
        <h1 className="mt-5 text-3xl font-bold text-ink">{miembro.nombre}</h1>
        <p className="mt-1 text-base font-medium" style={{ color: colorPrincipal }}>{miembro.giro}</p>
        <AccesosPerfil perfil={perfil} color={colorPrincipal} />
        {miembro.empresa && <p className="mt-1 text-sm text-ink/55">{miembro.empresa}</p>}
      </header>

      {usaLinkExterno ? (
        <section className="py-9 text-center">
          <a
            href={perfil.link_formato_uno_a_uno ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: colorPrincipal }}
          >
            Ver formato uno a uno
          </a>
        </section>
      ) : (
        <div className="divide-y divide-black/10">
          {perfil.acerca_de_mi && (
            <Seccion titulo="Acerca de mí" color={colorPrincipal}>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/75">
                {perfil.acerca_de_mi}
              </p>
            </Seccion>
          )}

          <SeccionPersonal perfil={perfil} color={colorPrincipal} />
          <SeccionLarga perfil={perfil} color={colorPrincipal} />

          {(listas.clientes_buscados.length > 0 ||
            listas.contactos.length > 0 ||
            listas.mejores_clientes.length > 0) && (
            <Seccion titulo="Clientes y contactos" color={colorPrincipal}>
              <div className="grid gap-7 sm:grid-cols-3">
                <ListaPublica titulo="Clientes buscados" items={listas.clientes_buscados} color={colorPrincipal} />
                <ListaPublica titulo="Contactos" items={listas.contactos} color={colorPrincipal} />
                <ListaPublica titulo="Mejores clientes" items={listas.mejores_clientes} color={colorPrincipal} />
              </div>
            </Seccion>
          )}
        </div>
      )}
    </article>
  );
}

function Seccion({
  titulo,
  color,
  children,
}: {
  titulo: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8">
      <h2 className="mb-4 text-lg font-bold" style={{ color }}>{titulo}</h2>
      {children}
    </section>
  );
}

function SeccionPersonal({
  perfil,
  color,
}: {
  perfil: PerfilPublicoData["perfil"];
  color: string;
}) {
  const datos = [
    ["Mascotas", perfil.mascotas],
    ["Familia", perfil.familia],
    ["Pasatiempos", perfil.pasatiempos],
    ["Otros intereses", perfil.otros_intereses],
    ["Ciudad", perfil.ciudad],
    ["Trabajos anteriores", perfil.trabajos_anteriores],
  ].filter(([, valor]) => Boolean(valor));
  if (datos.length === 0) return null;

  return (
    <Seccion titulo="Información personal" color={color}>
      <dl className="grid gap-5 sm:grid-cols-2">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className="text-sm font-bold" style={{ color }}>{etiqueta}</dt>
            <dd className="mt-1 text-[15px] leading-relaxed text-ink/70">{valor}</dd>
          </div>
        ))}
      </dl>
    </Seccion>
  );
}

function SeccionLarga({
  perfil,
  color,
}: {
  perfil: PerfilPublicoData["perfil"];
  color: string;
}) {
  const datos = [
    ["Habilidades", perfil.habilidades],
    ["Objetivos", perfil.objetivos],
    ["Redes", perfil.redes],
    ["Logros", perfil.logros],
    ["Intereses", perfil.intereses],
  ].filter(([, valor]) => Boolean(valor));
  if (datos.length === 0) return null;

  return (
    <Seccion titulo="Perfil profesional" color={color}>
      <div className="grid gap-6 sm:grid-cols-2">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <h3 className="text-sm font-bold" style={{ color }}>{etiqueta}</h3>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/70">
              {valor}
            </p>
          </div>
        ))}
      </div>
    </Seccion>
  );
}

function ListaPublica({
  titulo,
  items,
  color,
}: {
  titulo: string;
  items: PerfilListaItem[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-bold" style={{ color }}>{titulo}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/70">
        {items.map((item) => (
          <li key={item.id}>{item.contenido}</li>
        ))}
      </ul>
    </div>
  );
}

type TipoAcceso = "facebook" | "instagram" | "linkedin" | "web" | "telefono" | "whatsapp";

function AccesosPerfil({
  perfil,
  color,
}: {
  perfil: PerfilPublicoData["perfil"];
  color: string;
}) {
  const accesos: Array<{ nombre: string; href: string; tipo: TipoAcceso }> = [];
  if (perfil.facebook_url) accesos.push({ nombre: "Facebook", href: perfil.facebook_url, tipo: "facebook" });
  if (perfil.instagram_url) accesos.push({ nombre: "Instagram", href: perfil.instagram_url, tipo: "instagram" });
  if (perfil.linkedin_url) accesos.push({ nombre: "LinkedIn", href: perfil.linkedin_url, tipo: "linkedin" });
  if (perfil.pagina_web_url) accesos.push({ nombre: "Página web", href: perfil.pagina_web_url, tipo: "web" });
  if (perfil.telefono_contacto) {
    accesos.push({ nombre: "Llamar", href: `tel:${perfil.telefono_contacto}`, tipo: "telefono" });
    accesos.push({
      nombre: "WhatsApp",
      href: enlaceWhatsApp(perfil.telefono_contacto),
      tipo: "whatsapp",
    });
  }
  if (accesos.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {accesos.map(({ nombre, href, tipo }) => (
          <a
            key={nombre}
            href={href}
            target={tipo === "telefono" ? undefined : "_blank"}
            rel={tipo === "telefono" ? undefined : "noreferrer"}
            className="grid size-11 place-items-center rounded-full text-white shadow-sm transition hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: color, outlineColor: color }}
            aria-label={nombre}
            title={nombre}
          >
            <IconoAcceso tipo={tipo} />
          </a>
      ))}
    </div>
  );
}

function enlaceWhatsApp(telefono: string): string {
  const soloNumeros = telefono.replace(/\D/g, "");
  const numero = soloNumeros.length === 10 ? `52${soloNumeros}` : soloNumeros;
  const mensaje = encodeURIComponent("Hola, te conoci en BNI y me interesa conocer tu negocio");
  return `https://wa.me/${numero}?text=${mensaje}`;
}

function IconoAcceso({ tipo }: { tipo: TipoAcceso }) {
  const clase = "size-5 fill-none stroke-current stroke-2";
  if (tipo === "facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h3v8h3.5Z" /></svg>;
  }
  if (tipo === "instagram") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={clase}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" className="fill-current stroke-none" /></svg>;
  }
  if (tipo === "linkedin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={clase}><path d="M6 9v9M6 6v.01M10 18v-5a4 4 0 0 1 8 0v5M10 9v9" /></svg>;
  }
  if (tipo === "telefono") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={clase}><path d="M5 4.5 8.2 3l2.1 4.8-2.2 1.5a14.3 14.3 0 0 0 6.6 6.6l1.5-2.2L21 16l-1.5 3.2c-.5 1-1.6 1.6-2.7 1.3C9.8 19 5 14.2 3.5 7.2 3.3 6.1 3.9 5 5 4.5Z" /></svg>;
  }
  if (tipo === "whatsapp") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={clase}><path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" /><path d="M9.2 8.2c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c.5 1 1.3 1.8 2.4 2.4l.7-.5c.2-.1.4-.1.6 0l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.5-.5.7-.5.2-1.2.3-1.8.1-2.5-.9-4.5-2.9-5.4-5.4-.2-.6-.1-1.3.1-1.8Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={clase}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z" /></svg>;
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
