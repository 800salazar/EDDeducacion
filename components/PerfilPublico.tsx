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

          <RedesPerfil perfil={perfil} color={colorPrincipal} />
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

function RedesPerfil({
  perfil,
  color,
}: {
  perfil: PerfilPublicoData["perfil"];
  color: string;
}) {
  const redes = [
    ["Facebook", perfil.facebook_url],
    ["Instagram", perfil.instagram_url],
    ["LinkedIn", perfil.linkedin_url],
    ["Página web", perfil.pagina_web_url],
  ].filter(([, url]) => Boolean(url));
  if (redes.length === 0) return null;

  return (
    <Seccion titulo="Enlaces" color={color}>
      <div className="flex flex-wrap gap-2">
        {redes.map(([nombre, url]) => (
          <a
            key={nombre}
            href={url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-black/5"
            style={{ borderColor: color, color }}
          >
            {nombre}
          </a>
        ))}
      </div>
    </Seccion>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
