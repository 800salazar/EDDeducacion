"use client";

/* eslint-disable @next/next/no-img-element -- fotos optimizadas y con URLs dinámicas */
import { ChangeEvent, useRef, useState } from "react";
import {
  actualizarCampoPerfil,
  actualizarColorPrincipal,
  actualizarListaPerfil,
  actualizarUsuarioPerfil,
  eliminarFotoPerfil,
  eliminarLogoEmpresa,
  subirFotoPerfil,
  subirLogoEmpresa,
} from "@/app/(app)/perfil/actions";
import type { CampoPerfilEditable } from "@/lib/perfil-config";
import type {
  Miembro,
  PerfilListaItem,
  PerfilListaTipo,
  PerfilMiembro,
} from "@/lib/types";

type ValoresPerfil = Record<CampoPerfilEditable, string> & { usuario: string };
type EstadoGuardado = { tipo: "guardando" | "guardado" | "error"; texto: string } | null;

const COLOR_SISTEMA = "#6b7280";

const camposEnlaces: Array<{
  campo: CampoPerfilEditable;
  etiqueta: string;
  placeholder: string;
}> = [
  {
    campo: "link_formato_uno_a_uno",
    etiqueta: "Link a formato uno a uno",
    placeholder: "https://...",
  },
  { campo: "facebook_url", etiqueta: "Facebook", placeholder: "https://facebook.com/..." },
  { campo: "instagram_url", etiqueta: "Instagram", placeholder: "https://instagram.com/..." },
  { campo: "linkedin_url", etiqueta: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { campo: "pagina_web_url", etiqueta: "Página web", placeholder: "https://..." },
];

const camposPersonales: Array<{
  campo: CampoPerfilEditable;
  etiqueta: string;
  placeholder: string;
}> = [
  { campo: "mascotas", etiqueta: "Mascotas", placeholder: "Nombres de tus mascotas" },
  { campo: "familia", etiqueta: "Familia", placeholder: "Familia central" },
  { campo: "pasatiempos", etiqueta: "Pasatiempos", placeholder: "Tus pasatiempos" },
  { campo: "otros_intereses", etiqueta: "Otros intereses", placeholder: "Otros temas que disfrutas" },
  { campo: "ciudad", etiqueta: "Ciudad", placeholder: "Ciudad donde vives" },
  {
    campo: "trabajos_anteriores",
    etiqueta: "Trabajos anteriores",
    placeholder: "Experiencia anterior relevante",
  },
];

const camposHORLI: Array<{
  campo: CampoPerfilEditable;
  etiqueta: string;
}> = [
  { campo: "habilidades", etiqueta: "Habilidades" },
  { campo: "objetivos", etiqueta: "Objetivos" },
  { campo: "redes", etiqueta: "Redes" },
  { campo: "logros", etiqueta: "Logros" },
  { campo: "intereses", etiqueta: "Intereses" },
];

export function PerfilEditor({
  miembro,
  perfil,
  listas,
}: {
  miembro: Miembro;
  perfil: PerfilMiembro;
  listas: Record<PerfilListaTipo, PerfilListaItem[]>;
}) {
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputLogo = useRef<HTMLInputElement>(null);
  const [valores, setValores] = useState<ValoresPerfil>(() => valoresDesdePerfil(perfil));
  const [fotoUrl, setFotoUrl] = useState(perfil.foto_url);
  const [logoUrl, setLogoUrl] = useState(perfil.logo_empresa_url);
  const [colorPrincipal, setColorPrincipal] = useState(perfil.color_principal ?? COLOR_SISTEMA);
  const [usaColorPersonalizado, setUsaColorPersonalizado] = useState(Boolean(perfil.color_principal));
  const [estado, setEstado] = useState<EstadoGuardado>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  async function guardarCampo(campo: CampoPerfilEditable) {
    const resultado = await guardarConEstado(
      () => actualizarCampoPerfil(campo, valores[campo]),
      "Guardando cambios..."
    );
    if (resultado?.ok && resultado.valor !== undefined) {
      setValores((actual) => ({ ...actual, [campo]: resultado.valor ?? "" }));
    }
  }

  async function guardarUsuario() {
    const resultado = await guardarConEstado(
      () => actualizarUsuarioPerfil(valores.usuario),
      "Guardando usuario..."
    );
    if (resultado?.ok && resultado.valor) {
      setValores((actual) => ({ ...actual, usuario: resultado.valor ?? actual.usuario }));
    }
  }

  async function guardarConEstado(
    guardar: () => ReturnType<typeof actualizarCampoPerfil>,
    mensaje: string
  ) {
    setEstado({ tipo: "guardando", texto: mensaje });
    try {
      const resultado = await guardar();
      if (!resultado.ok) {
        setEstado({ tipo: "error", texto: resultado.error });
        return resultado;
      }
      setEstado({ tipo: "guardado", texto: "Guardado" });
      return resultado;
    } catch {
      setEstado({ tipo: "error", texto: "No se pudo guardar el cambio." });
      return null;
    }
  }

  async function alSeleccionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSubiendoFoto(true);
    setEstado({ tipo: "guardando", texto: "Preparando foto..." });
    try {
      const foto = await optimizarFotoPerfil(file);
      const formData = new FormData();
      formData.append("foto", foto);
      const resultado = await subirFotoPerfil(formData);
      if (!resultado.ok) {
        setEstado({ tipo: "error", texto: resultado.error });
        return;
      }
      setFotoUrl(resultado.fotoUrl ?? null);
      setEstado({ tipo: "guardado", texto: "Foto actualizada" });
    } catch (error) {
      setEstado({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo preparar la foto.",
      });
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function quitarFoto() {
    setSubiendoFoto(true);
    setEstado({ tipo: "guardando", texto: "Eliminando foto..." });
    const resultado = await eliminarFotoPerfil();
    if (!resultado.ok) {
      setEstado({ tipo: "error", texto: resultado.error });
    } else {
      setFotoUrl(null);
      setEstado({ tipo: "guardado", texto: "Foto eliminada" });
    }
    setSubiendoFoto(false);
  }

  async function guardarColor(color: string | null) {
    const anterior = colorPrincipal;
    setColorPrincipal(color ?? COLOR_SISTEMA);
    const resultado = await guardarConEstado(
      () => actualizarColorPrincipal(color),
      "Guardando color..."
    );
    if (!resultado?.ok) {
      setColorPrincipal(anterior);
      return;
    }
    setUsaColorPersonalizado(Boolean(color));
  }

  async function alSeleccionarLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSubiendoLogo(true);
    setEstado({ tipo: "guardando", texto: "Preparando logo..." });
    try {
      const logo = await optimizarLogoEmpresa(file);
      const formData = new FormData();
      formData.append("logo", logo);
      const resultado = await subirLogoEmpresa(formData);
      if (!resultado.ok) {
        setEstado({ tipo: "error", texto: resultado.error });
        return;
      }
      setLogoUrl(resultado.fotoUrl ?? null);
      setEstado({ tipo: "guardado", texto: "Logo actualizado" });
    } catch (error) {
      setEstado({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo preparar el logo.",
      });
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function quitarLogo() {
    setSubiendoLogo(true);
    setEstado({ tipo: "guardando", texto: "Eliminando logo..." });
    const resultado = await eliminarLogoEmpresa();
    if (!resultado.ok) {
      setEstado({ tipo: "error", texto: resultado.error });
    } else {
      setLogoUrl(null);
      setEstado({ tipo: "guardado", texto: "Logo eliminado" });
    }
    setSubiendoLogo(false);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-bni">Perfil público</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-sm text-ink/55">{miembro.nombre} · {miembro.giro}</p>
        </div>
        <a
          href={`/${valores.usuario}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-semibold text-ink transition hover:bg-black/5"
        >
          Ver perfil público
        </a>
      </div>

      {estado && (
        <p
          className={`mt-4 text-sm font-medium ${
            estado.tipo === "error" ? "text-bni" : "text-ink/55"
          }`}
          role={estado.tipo === "error" ? "alert" : "status"}
        >
          {estado.texto}
        </p>
      )}

      <section className="grid gap-6 py-7 sm:grid-cols-[11rem_1fr]">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div className="grid size-36 place-items-center overflow-hidden rounded-2xl bg-bni text-3xl font-bold text-white">
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto de perfil" className="size-full object-cover" />
            ) : (
              iniciales(miembro.nombre)
            )}
          </div>
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={alSeleccionarFoto}
          />
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={subiendoFoto}
            className="min-h-10 px-2 text-sm font-semibold text-bni disabled:opacity-50"
          >
            {fotoUrl ? "Cambiar foto" : "Agregar foto"}
          </button>
          {fotoUrl && (
            <button
              type="button"
              onClick={quitarFoto}
              disabled={subiendoFoto}
              className="min-h-10 px-2 text-sm font-medium text-ink/50 disabled:opacity-50"
            >
              Eliminar foto
            </button>
          )}

          <div className="mt-2 w-full border-t border-black/10 pt-4 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Logo de empresa</p>
            {logoUrl && (
              <div className="mt-2 flex h-16 w-full items-center justify-center rounded-lg border border-black/10 bg-white p-2 sm:w-40">
                <img src={logoUrl} alt="Logo de empresa" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <input
              ref={inputLogo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={alSeleccionarLogo}
            />
            <button
              type="button"
              onClick={() => inputLogo.current?.click()}
              disabled={subiendoLogo}
              className="mt-2 min-h-10 px-2 text-sm font-semibold text-bni disabled:opacity-50"
            >
              {logoUrl ? "Cambiar logo" : "Agregar logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={quitarLogo}
                disabled={subiendoLogo}
                className="ml-1 min-h-10 px-2 text-sm font-medium text-ink/50 disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Campo
            etiqueta="Usuario público"
            value={valores.usuario}
            onChange={(valor) => setValores((actual) => ({ ...actual, usuario: valor }))}
            onBlur={guardarUsuario}
            placeholder="tu-usuario"
          />
          <p className="pb-3 text-sm text-ink/50">/{valores.usuario || "tu-usuario"}</p>
        </div>
      </section>

      <Seccion titulo="Estilo del perfil">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-black/10 bg-white px-3 shadow-sm transition hover:bg-black/5">
            <span
              className="size-7 rounded-md border border-black/15"
              style={{ backgroundColor: colorPrincipal }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-ink">Elegir color personalizado</span>
            <span className="font-mono text-xs text-ink/50">{colorPrincipal.toUpperCase()}</span>
            <input
              type="color"
              value={colorPrincipal}
              onChange={(event) => void guardarColor(event.target.value)}
              className="sr-only"
              aria-label="Elegir color personalizado"
            />
          </label>
          {usaColorPersonalizado && (
            <button
              type="button"
              onClick={() => void guardarColor(null)}
              className="min-h-11 px-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
            >
              Usar color del sistema
            </button>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Link y redes">
        <div className="grid gap-4 sm:grid-cols-2">
          {camposEnlaces.map((item) => (
            <Campo
              key={item.campo}
              etiqueta={item.etiqueta}
              type="url"
              value={valores[item.campo]}
              onChange={(valor) => actualizarValor(item.campo, valor, setValores)}
              onBlur={() => guardarCampo(item.campo)}
              placeholder={item.placeholder}
            />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Acerca de mí">
        <Campo
          etiqueta="Acerca de mí"
          value={valores.acerca_de_mi}
          onChange={(valor) => actualizarValor("acerca_de_mi", valor, setValores)}
          onBlur={() => guardarCampo("acerca_de_mi")}
          multiline
          maxLength={500}
          placeholder="Comparte algo que quieras que otros conozcan de ti."
        />
      </Seccion>

      <Seccion titulo="Información personal">
        <div className="grid gap-4 sm:grid-cols-2">
          {camposPersonales.map((item) => (
            <Campo
              key={item.campo}
              etiqueta={item.etiqueta}
              value={valores[item.campo]}
              onChange={(valor) => actualizarValor(item.campo, valor, setValores)}
              onBlur={() => guardarCampo(item.campo)}
              placeholder={item.placeholder}
            />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Habilidades, objetivos e intereses">
        <div className="grid gap-4 sm:grid-cols-2">
          {camposHORLI.map((item) => (
            <Campo
              key={item.campo}
              etiqueta={item.etiqueta}
              value={valores[item.campo]}
              onChange={(valor) => actualizarValor(item.campo, valor, setValores)}
              onBlur={() => guardarCampo(item.campo)}
              multiline
              maxLength={400}
              placeholder={`Escribe tus ${item.etiqueta.toLowerCase()}.`}
            />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Clientes y contactos">
        <div className="grid gap-7 lg:grid-cols-3">
          <ListaPerfil
            tipo="clientes_buscados"
            titulo="Clientes buscados"
            itemsIniciales={listas.clientes_buscados.map((item) => item.contenido)}
            notificar={setEstado}
          />
          <ListaPerfil
            tipo="contactos"
            titulo="Contactos"
            itemsIniciales={listas.contactos.map((item) => item.contenido)}
            notificar={setEstado}
          />
          <ListaPerfil
            tipo="mejores_clientes"
            titulo="Mejores clientes"
            itemsIniciales={listas.mejores_clientes.map((item) => item.contenido)}
            notificar={setEstado}
          />
        </div>
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/10 py-7">
      <h2 className="mb-5 text-lg font-bold text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  etiqueta,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  multiline = false,
  maxLength,
}: {
  etiqueta: string;
  value: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
  placeholder: string;
  type?: "text" | "url";
  multiline?: boolean;
  maxLength?: number;
}) {
  const className =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-bni focus:ring-2 focus:ring-bni/20";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/70">{etiqueta}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={5}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={className}
        />
      )}
    </label>
  );
}

function ListaPerfil({
  tipo,
  titulo,
  itemsIniciales,
  notificar,
}: {
  tipo: PerfilListaTipo;
  titulo: string;
  itemsIniciales: string[];
  notificar: (estado: EstadoGuardado) => void;
}) {
  const [items, setItems] = useState<string[]>(
    itemsIniciales.length > 0 ? itemsIniciales : [""]
  );

  async function guardar(itemsAGuardar: string[]) {
    notificar({ tipo: "guardando", texto: "Guardando lista..." });
    const resultado = await actualizarListaPerfil(tipo, itemsAGuardar);
    if (!resultado.ok) {
      notificar({ tipo: "error", texto: resultado.error });
      return;
    }
    notificar({ tipo: "guardado", texto: "Lista guardada" });
  }

  function actualizar(index: number, valor: string) {
    setItems((actuales) => actuales.map((item, i) => (i === index ? valor : item)));
  }

  function agregar() {
    setItems((actuales) => [...actuales, ""]);
  }

  function quitar(index: number) {
    const siguientes = items.length === 1 ? [""] : items.filter((_, i) => i !== index);
    setItems(siguientes);
    void guardar(siguientes);
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-ink">{titulo}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={`${tipo}-${index}`} className="flex gap-2">
            <input
              value={item}
              onChange={(event) => actualizar(index, event.target.value)}
              onBlur={() => void guardar(items)}
              placeholder={`${titulo} ${index + 1}`}
              maxLength={180}
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
            />
            <button
              type="button"
              onClick={() => quitar(index)}
              className="grid size-10 place-items-center rounded-lg border border-black/10 text-ink/55 transition hover:bg-black/5"
              aria-label={`Quitar ${titulo}`}
            >
              −
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={agregar}
        className="mt-3 text-sm font-semibold text-bni transition hover:text-bni-dark"
      >
        + Agregar
      </button>
    </div>
  );
}

function valoresDesdePerfil(perfil: PerfilMiembro): ValoresPerfil {
  return {
    usuario: perfil.usuario,
    link_formato_uno_a_uno: perfil.link_formato_uno_a_uno ?? "",
    facebook_url: perfil.facebook_url ?? "",
    instagram_url: perfil.instagram_url ?? "",
    linkedin_url: perfil.linkedin_url ?? "",
    pagina_web_url: perfil.pagina_web_url ?? "",
    acerca_de_mi: perfil.acerca_de_mi ?? "",
    mascotas: perfil.mascotas ?? "",
    familia: perfil.familia ?? "",
    pasatiempos: perfil.pasatiempos ?? "",
    otros_intereses: perfil.otros_intereses ?? "",
    ciudad: perfil.ciudad ?? "",
    trabajos_anteriores: perfil.trabajos_anteriores ?? "",
    habilidades: perfil.habilidades ?? "",
    objetivos: perfil.objetivos ?? "",
    redes: perfil.redes ?? "",
    logros: perfil.logros ?? "",
    intereses: perfil.intereses ?? "",
  };
}

function actualizarValor(
  campo: CampoPerfilEditable,
  valor: string,
  setValores: React.Dispatch<React.SetStateAction<ValoresPerfil>>
) {
  setValores((actual) => ({ ...actual, [campo]: valor }));
}

async function optimizarFotoPerfil(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const imagen = await cargarImagen(objectUrl);
    const size = 640;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la foto.");

    const lado = Math.min(imagen.naturalWidth, imagen.naturalHeight);
    const sx = (imagen.naturalWidth - lado) / 2;
    const sy = (imagen.naturalHeight - lado) / 2;
    ctx.drawImage(imagen, sx, sy, lado, lado, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    );
    if (!blob) throw new Error("No se pudo comprimir la foto.");
    return new File([blob], "perfil.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function optimizarLogoEmpresa(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const imagen = await cargarImagen(objectUrl);
    const escala = Math.min(640 / imagen.naturalWidth, 320 / imagen.naturalHeight, 1);
    const ancho = Math.max(1, Math.round(imagen.naturalWidth * escala));
    const alto = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar el logo.");

    ctx.drawImage(imagen, 0, 0, ancho, alto);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) throw new Error("No se pudo comprimir el logo.");
    return new File([blob], "logo.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo leer la foto."));
    imagen.src = src;
  });
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
