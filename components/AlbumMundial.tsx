"use client";

/* eslint-disable @next/next/no-img-element -- fotos ya optimizadas y con URLs dinámicas */
import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  eliminarEstampaAlbum,
  guardarEstampaAlbum,
} from "@/app/(app)/album/actions";
import type { AlbumEstampa, Miembro } from "@/lib/types";

type EstampaVista = Pick<AlbumEstampa, "objetivo_miembro_id" | "foto_url">;

export function AlbumMundial({
  miembro,
  objetivos,
  estampasIniciales,
}: {
  miembro: Miembro;
  objetivos: Miembro[];
  estampasIniciales: AlbumEstampa[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [seleccionado, setSeleccionado] = useState<Miembro | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estampas, setEstampas] = useState<Record<string, EstampaVista>>(() =>
    Object.fromEntries(
      estampasIniciales.map((estampa) => [
        estampa.objetivo_miembro_id,
        {
          objetivo_miembro_id: estampa.objetivo_miembro_id,
          foto_url: estampa.foto_url,
        },
      ])
    )
  );

  const completadas = useMemo(
    () => objetivos.filter((objetivo) => estampas[objetivo.id]?.foto_url).length,
    [objetivos, estampas]
  );
  const objetivosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return objetivos;
    return objetivos.filter((objetivo) =>
      normalizarTexto(objetivo.nombre).includes(termino)
    );
  }, [busqueda, objetivos]);
  const total = objetivos.length;
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  const estampaSeleccionada = seleccionado
    ? estampas[seleccionado.id] ?? null
    : null;

  async function onFotoSeleccionada(event: ChangeEvent<HTMLInputElement>) {
    const target = seleccionado;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!target || !file) return;

    setError(null);
    setOcupadoId(target.id);
    try {
      const foto = await optimizarFotoCuadrada(file);
      const formData = new FormData();
      formData.append("objetivo_miembro_id", target.id);
      formData.append("foto", foto);

      const result = await guardarEstampaAlbum(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEstampas((actuales) => ({
        ...actuales,
        [result.objetivoMiembroId]: {
          objetivo_miembro_id: result.objetivoMiembroId,
          foto_url: result.fotoUrl ?? "",
        },
      }));
      setSeleccionado(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo preparar la foto."
      );
    } finally {
      setOcupadoId(null);
    }
  }

  async function eliminarFoto() {
    if (!seleccionado) return;

    setError(null);
    setOcupadoId(seleccionado.id);
    const formData = new FormData();
    formData.append("objetivo_miembro_id", seleccionado.id);

    try {
      const result = await eliminarEstampaAlbum(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEstampas((actuales) => {
        const copia = { ...actuales };
        delete copia[result.objetivoMiembroId];
        return copia;
      });
      setSeleccionado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setOcupadoId(null);
    }
  }

  async function compartirAlbum() {
    setError(null);
    setCompartiendo(true);
    try {
      const blob = await crearImagenAlbum({
        miembro,
        objetivos,
        estampas,
        completadas,
      });
      const file = new File([blob], `${slug(miembro.nombre)}-mundial.jpg`, {
        type: "image/jpeg",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Mi Mundial de Uno a Unos",
          files: [file],
        });
      } else {
        descargarArchivo(file);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "No se pudo generar la imagen."
      );
    } finally {
      setCompartiendo(false);
    }
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-emerald-950/15 bg-[#0e442e] shadow-sm">
        <div className="relative px-5 py-5 text-white sm:px-6">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.12) 1px, transparent 1px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 96px, transparent 96px 192px)",
              backgroundSize: "42px 42px, 42px 42px, 192px 100%",
            }}
            aria-hidden
          />
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
          <div className="absolute inset-y-8 left-5 w-16 rounded-r-full border-y-2 border-r-2 border-white/20" />
          <div className="absolute inset-y-8 right-5 w-16 rounded-l-full border-y-2 border-l-2 border-white/20" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white/85">
                <span aria-hidden>⚽</span>
                Mundial 2026
              </p>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Mi Mundial de Uno a Unos ⚽
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.04em]">
                <span className="rounded-full bg-[#0b8f4d] px-2.5 py-1 text-white">
                  México
                </span>
                <span className="rounded-full bg-[#174ea6] px-2.5 py-1 text-white">
                  Estados Unidos
                </span>
                <span className="rounded-full bg-[#d71920] px-2.5 py-1 text-white">
                  Canadá
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-right shadow-inner">
                <p className="text-xl font-bold leading-none">
                  {completadas}/{total}
                </p>
                <p className="mt-1 text-xs font-medium text-white/70">
                  {porcentaje}% completo
                </p>
              </div>
              <button
                type="button"
                onClick={compartirAlbum}
                disabled={compartiendo || total === 0}
                className="h-11 rounded-xl bg-white px-4 text-sm font-black text-[#0e442e] shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {compartiendo ? "Generando..." : "⚽ Compartir"}
              </button>
            </div>
          </div>
          <div className="relative mt-4 h-3 overflow-hidden rounded-full border border-white/15 bg-black/25">
            <div
              className="h-full rounded-full bg-[#f7f7f7] transition-[width]"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-bni/20 bg-white px-4 py-3 text-sm font-medium text-bni">
          {error}
        </p>
      )}

      {total > 0 && (
        <div className="mb-4 rounded-xl border border-emerald-950/10 bg-white p-3 shadow-sm">
          <label
            htmlFor="buscar-miembro"
            className="mb-2 block text-sm font-bold text-ink/70"
          >
            Buscar miembro ⚽
          </label>
          <input
            id="buscar-miembro"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Escribe un nombre"
            className="h-11 w-full rounded-lg border border-emerald-950/15 px-3 text-sm text-ink outline-none transition focus:border-[#0e442e]/50 focus:ring-2 focus:ring-[#0e442e]/20"
          />
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center text-ink/55">
          No hay otros miembros activos todavía.
        </div>
      ) : objetivosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center text-ink/55">
          No encontramos miembros con ese nombre.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {objetivosFiltrados.map((objetivo) => {
            const fotoUrl = estampas[objetivo.id]?.foto_url;
            const ocupado = ocupadoId === objetivo.id;

            return (
              <button
                key={objetivo.id}
                type="button"
                onClick={() => {
                  setSeleccionado(objetivo);
                  setError(null);
                }}
                className="group relative aspect-square overflow-hidden rounded-xl border border-emerald-950/15 bg-[#dbe8dc] text-left shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-[#0e442e]/40 hover:shadow-md focus:ring-2 focus:ring-[#0e442e]/25"
              >
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt=""
                    className="size-full object-cover transition group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="relative grid size-full place-items-center bg-[#dbe8dc]">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, rgba(14,68,46,0.08) 0 38px, rgba(255,255,255,0.18) 38px 76px)",
                      }}
                      aria-hidden
                    />
                    <span className="relative text-center">
                      <span className="block text-3xl" aria-hidden>
                        ⚽
                      </span>
                      <span className="mt-1 block text-2xl font-black text-[#0e442e]/35">
                        {iniciales(objetivo.nombre)}
                      </span>
                    </span>
                  </div>
                )}
                <span
                  className={`absolute inset-x-0 bottom-0 flex min-h-12 items-center justify-center px-2 py-1.5 text-center text-xs font-semibold leading-tight ${
                    fotoUrl
                      ? "bg-[#0e442e]/80 text-white"
                      : "bg-white/90 text-[#0e442e]"
                  }`}
                >
                  <span className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {ocupado ? "Guardando..." : objetivo.nombre}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      )}

      {seleccionado && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 py-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative bg-[#0e442e] px-5 py-4 text-white">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 44px, transparent 44px 88px)",
                }}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-white/70">
                    Estampa ⚽
                  </p>
                  <h2 className="truncate text-xl font-black">
                    {seleccionado.nombre}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSeleccionado(null)}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-xl leading-none text-white transition hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="aspect-square overflow-hidden rounded-xl border border-emerald-950/15 bg-[#dbe8dc]">
                {estampaSeleccionada?.foto_url ? (
                  <img
                    src={estampaSeleccionada.foto_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="relative grid size-full place-items-center">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, rgba(14,68,46,0.08) 0 52px, rgba(255,255,255,0.18) 52px 104px)",
                      }}
                      aria-hidden
                    />
                    <span className="relative text-center">
                      <span className="block text-5xl" aria-hidden>
                        ⚽
                      </span>
                      <span className="mt-2 block text-5xl font-black text-[#0e442e]/35">
                        {iniciales(seleccionado.nombre)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFotoSeleccionada}
              />

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={ocupadoId === seleccionado.id}
                  className="h-11 rounded-xl bg-[#0e442e] px-4 text-sm font-black text-white transition hover:bg-[#123927] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                >
                  {estampaSeleccionada?.foto_url
                    ? "⚽ Cambiar foto"
                    : "⚽ Cargar foto"}
                </button>

                {estampaSeleccionada?.foto_url && (
                  <button
                    type="button"
                    onClick={eliminarFoto}
                    disabled={ocupadoId === seleccionado.id}
                    className="h-11 rounded-xl border border-[#d71920]/25 px-4 text-sm font-black text-[#b0151b] transition hover:bg-[#d71920]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                  >
                    Eliminar foto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

async function optimizarFotoCuadrada(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  const image = await cargarImagen(objectUrl, true);
  const size = 900;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la foto.");

  const lado = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - lado) / 2;
  const sy = (image.naturalHeight - lado) / 2;
  ctx.drawImage(image, sx, sy, lado, lado, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.78)
  );
  URL.revokeObjectURL(objectUrl);
  if (!blob) throw new Error("No se pudo comprimir la foto.");

  return new File([blob], "estampa.jpg", { type: "image/jpeg" });
}

async function crearImagenAlbum({
  miembro,
  objetivos,
  estampas,
  completadas,
}: {
  miembro: Miembro;
  objetivos: Miembro[];
  estampas: Record<string, EstampaVista>;
  completadas: number;
}): Promise<Blob> {
  const imagenes = new Map<string, HTMLImageElement>();
  await Promise.all(
    objetivos.map(async (objetivo) => {
      const url = estampas[objetivo.id]?.foto_url;
      if (!url) return;
      try {
        imagenes.set(objetivo.id, await cargarImagen(url));
      } catch {
        // Si una foto no carga por red/CORS, el álbum sigue generándose.
      }
    })
  );

  const total = objetivos.length;
  const cols = total <= 12 ? 4 : total <= 24 ? 5 : total <= 42 ? 6 : 7;
  const rows = Math.max(1, Math.ceil(total / cols));
  const width = 1600;
  const margin = 72;
  const gap = 18;
  const headerHeight = 220;
  const footerHeight = 72;
  const tile = Math.floor((width - margin * 2 - gap * (cols - 1)) / cols);
  const height =
    headerHeight + rows * tile + Math.max(0, rows - 1) * gap + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo generar la imagen.");

  ctx.fillStyle = "#eef4ed";
  ctx.fillRect(0, 0, width, height);

  for (let x = 0; x < width; x += 150) {
    ctx.fillStyle = Math.floor(x / 150) % 2 === 0 ? "#e5efe4" : "#f5f8f4";
    ctx.fillRect(x, headerHeight - 8, 150, height - headerHeight + 8);
  }

  ctx.fillStyle = "#0e442e";
  ctx.fillRect(0, 0, width, 142);
  for (let x = 0; x < width; x += 160) {
    ctx.fillStyle = x / 160 % 2 === 0 ? "rgba(255,255,255,0.08)" : "transparent";
    ctx.fillRect(x, 0, 160, 142);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(width / 2, 88, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, 142);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 58px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("⚽ Mi Mundial de Uno a Unos", margin, 76);
  ctx.font = "500 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(`Jugador: ${miembro.nombre}`, margin, 118);

  const marcadorX = width - margin - 380;
  dibujarRectRedondeado(ctx, marcadorX, 32, 380, 80, 22, "rgba(0,0,0,0.24)");
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(
    `${completadas} de ${total} completadas`,
    marcadorX + 190,
    82
  );
  ctx.textAlign = "left";

  const paisY = 162;
  dibujarRectRedondeado(ctx, margin, paisY, 142, 38, 18, "#0b8f4d");
  dibujarRectRedondeado(ctx, margin + 154, paisY, 230, 38, 18, "#174ea6");
  dibujarRectRedondeado(ctx, margin + 396, paisY, 142, 38, 18, "#d71920");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("México", margin + 34, paisY + 26);
  ctx.fillText("Estados Unidos", margin + 180, paisY + 26);
  ctx.fillText("Canadá", margin + 430, paisY + 26);

  objetivos.forEach((objetivo, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = margin + col * (tile + gap);
    const y = headerHeight + row * (tile + gap);
    const img = imagenes.get(objetivo.id);

    dibujarRectRedondeado(
      ctx,
      x,
      y,
      tile,
      tile,
      18,
      img ? "#ffffff" : "#dbe8dc"
    );
    ctx.save();
    trazarRectRedondeado(ctx, x, y, tile, tile, 18);
    ctx.clip();

    if (img) {
      dibujarImagenCover(ctx, img, x, y, tile, tile);
      ctx.fillStyle = "rgba(14,68,46,0.78)";
    } else {
      for (let stripe = 0; stripe < tile; stripe += 44) {
        ctx.fillStyle =
          stripe / 44 % 2 === 0 ? "rgba(14,68,46,0.08)" : "rgba(255,255,255,0.24)";
        ctx.fillRect(x + stripe, y, 44, tile);
      }
      ctx.fillStyle = "rgba(14,68,46,0.20)";
      ctx.font = "700 44px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚽", x + tile / 2, y + tile / 2 - 12);
      ctx.font = "800 42px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(iniciales(objetivo.nombre), x + tile / 2, y + tile / 2 + 42);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
    }

    ctx.fillRect(x, y + tile - 58, tile, 58);
    ctx.restore();

    ctx.fillStyle = img ? "#ffffff" : "#0e442e";
    ctx.textAlign = "center";
    ctx.font = "700 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    dibujarNombre(ctx, objetivo.nombre, x + tile / 2, y + tile - 35, tile - 22);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#14151a";
  ctx.font = "500 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    "⚽ Tecnología de SalazarConsultores.com",
    width - margin,
    height - 30
  );
  ctx.textAlign = "left";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
  if (!blob) throw new Error("No se pudo exportar la imagen.");
  return blob;
}

function cargarImagen(src: string, local = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!local) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar una foto."));
    img.src = src;
  });
}

function dibujarImagenCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const ratioDestino = width / height;
  const ratioImagen = img.naturalWidth / img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (ratioImagen > ratioDestino) {
    sw = img.naturalHeight * ratioDestino;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / ratioDestino;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

function dibujarNombre(
  ctx: CanvasRenderingContext2D,
  nombre: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const palabras = nombre.split(/\s+/);
  const lineas: string[] = [];
  let linea = "";

  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= maxWidth || !linea) {
      linea = prueba;
    } else {
      lineas.push(linea);
      linea = palabra;
    }
  }
  if (linea) lineas.push(linea);

  const visibles = lineas.slice(0, 2);
  if (lineas.length > 2) {
    visibles[1] = ajustarConPuntos(ctx, visibles[1], maxWidth);
  }

  const offset = visibles.length === 1 ? 0 : -12;
  visibles.forEach((texto, index) => {
    ctx.fillText(texto, x, y + offset + index * 24, maxWidth);
  });
}

function ajustarConPuntos(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxWidth: number
): string {
  let salida = texto;
  while (salida.length > 1 && ctx.measureText(`${salida}...`).width > maxWidth) {
    salida = salida.slice(0, -1);
  }
  return `${salida}...`;
}

function dibujarRectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
) {
  ctx.fillStyle = fill;
  trazarRectRedondeado(ctx, x, y, width, height, radius);
  ctx.fill();
}

function trazarRectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function descargarArchivo(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

function slug(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "mi-album"
  );
}
