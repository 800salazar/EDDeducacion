"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { crearMentoria, eliminarMentoria, guardarSemana, marcarSemana } from "@/app/admin/mentores/actions";
import { MAX_EVIDENCIA_BYTES, type EstadoMentoria, type MiembroMentoria, type SemanaMentoria } from "@/lib/mentores";

const input = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-bni focus:ring-2 focus:ring-bni/20";
const boton = "rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/85 disabled:opacity-50";
const inicial: EstadoMentoria = {};

function Resultado({ estado }: { estado: EstadoMentoria }) {
  return <p aria-live="polite" className={`text-sm ${estado.error ? "text-red-700" : "text-emerald-700"}`}>
    {estado.error ?? estado.mensaje}
  </p>;
}

export function NuevaMentoria({ miembros }: { miembros: MiembroMentoria[] }) {
  const [estado, action, pendiente] = useActionState(crearMentoria, inicial);
  const [mentor, setMentor] = useState("");
  const [mentoreado, setMentoreado] = useState("");
  const [buscarMentor, setBuscarMentor] = useState("");
  const [buscarMentoreado, setBuscarMentoreado] = useState("");
  const filtrar = (busqueda: string, seleccionado: string) => {
    const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const palabras = normalizar(busqueda).trim().split(/\s+/).filter(Boolean);
    return miembros.filter((m) => m.id === seleccionado || palabras.every((p) => normalizar(m.nombre).includes(p)));
  };
  return <details className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
    <summary className="cursor-pointer text-sm font-semibold">+ Nueva pareja</summary>
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 text-sm font-medium">
        <label htmlFor="buscar-mentor" className="block">Buscar mentor</label>
        <input id="buscar-mentor" type="search" className={input} placeholder="Escribe un nombre…" value={buscarMentor} onChange={(e) => setBuscarMentor(e.target.value)} />
        <label htmlFor="mentor-id" className="block">Mentor</label>
        <select id="mentor-id" name="mentor_id" required className={input} value={mentor} onChange={(e) => {
          setMentor(e.target.value);
          if (e.target.value === mentoreado) setMentoreado("");
        }}>
          <option value="">Selecciona un miembro</option>
          {filtrar(buscarMentor, mentor).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        {filtrar(buscarMentor, "").length === 0 && <p className="text-xs text-ink/55">No encontramos miembros con ese nombre.</p>}
      </div>
      <div className="space-y-2 text-sm font-medium">
        <label htmlFor="buscar-mentoreado" className="block">Buscar mentoreado</label>
        <input id="buscar-mentoreado" type="search" className={input} placeholder="Escribe un nombre…" value={buscarMentoreado} onChange={(e) => setBuscarMentoreado(e.target.value)} />
        <label htmlFor="mentoreado-id" className="block">Mentoreado</label>
        <select id="mentoreado-id" name="mentoreado_id" required className={input} value={mentoreado} onChange={(e) => setMentoreado(e.target.value)}>
          <option value="">Selecciona un miembro</option>
          {filtrar(buscarMentoreado, mentoreado).map((m) => <option key={m.id} value={m.id} disabled={m.id === mentor}>{m.nombre}</option>)}
        </select>
        {filtrar(buscarMentoreado, "").length === 0 && <p className="text-xs text-ink/55">No encontramos miembros con ese nombre.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className={boton} disabled={pendiente || miembros.length < 2}>
          {pendiente ? "Creando…" : "Crear pareja"}
        </button>
        <Resultado estado={estado} />
        {miembros.length < 2 ? <p className="text-sm text-ink/60">Necesitas al menos dos miembros activos.</p> : null}
      </div>
    </form>
  </details>;
}

export function CasillaSemana({ id, semana, completada, pareja }: {
  id: string; semana: number; completada: boolean; pareja: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string>();
  return <div className="flex flex-col items-center gap-1">
    <input type="checkbox" checked={completada} disabled={pendiente}
      aria-label={`Semana ${semana}: ${pareja}`} aria-busy={pendiente}
      className="h-5 w-5 cursor-pointer accent-emerald-700 disabled:opacity-40"
      onChange={(e) => {
        const valor = e.target.checked;
        setError(undefined);
        iniciar(async () => {
          try { setError((await marcarSemana(id, semana, valor)).error); }
          catch { setError("Error de conexión. Intenta nuevamente."); }
        });
      }} />
    {error ? <span role="alert" className="max-w-32 text-xs text-red-700">{error}</span> : null}
  </div>;
}

export function FormularioSemana({ registro }: { registro: SemanaMentoria }) {
  const [estado, action, pendiente] = useActionState<EstadoMentoria, FormData>(async (anterior, form) => {
    try {
      const resultado = await guardarSemana(anterior, form);
      // Una revalidación de otra semana no cambia la versión del borrador abierto.
      return { ...resultado, version: resultado.version ?? anterior.version };
    } catch {
      return { error: "Error de conexión. Tus notas siguen aquí; intenta guardar nuevamente.", version: anterior.version };
    }
  }, { version: registro.updated_at });
  const [errorArchivo, setErrorArchivo] = useState<string>();
  const [notas, setNotas] = useState(registro.notas ?? "");
  const [completada, setCompletada] = useState(registro.completada);
  const id = `semana-${registro.semana}`;
  const evidencia = registro.evidencia_path
    ? `/admin/mentores/${registro.mentoria_id}/evidencia?semana=${registro.semana}&v=${encodeURIComponent(registro.updated_at)}`
    : null;
  return <details id={id} className="scroll-mt-24 rounded-2xl border border-black/10 bg-white shadow-sm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
      <span className="font-semibold">Semana {registro.semana}</span>
      <span className="flex items-center gap-3 text-xs text-ink/55">
        {registro.notas ? <span>Notas</span> : null}
        {evidencia ? <span>Imagen</span> : null}
        <span className={`rounded-full px-3 py-1 font-medium ${registro.completada ? "bg-emerald-50 text-emerald-800" : "bg-black/5 text-ink/60"}`}>
          {registro.completada ? "Completada" : "Pendiente"}
        </span>
        <span aria-hidden="true">⌄</span>
      </span>
    </summary>
    <form action={action} className="space-y-4 border-t border-black/5 p-5">
      <input type="hidden" name="mentoria_id" value={registro.mentoria_id} />
      <input type="hidden" name="semana" value={registro.semana} />
      <input type="hidden" name="version" value={estado.version} />
      <fieldset disabled={pendiente} className="space-y-4 disabled:opacity-60">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="completada" checked={completada} onChange={(e) => setCompletada(e.target.checked)} className="h-5 w-5 accent-emerald-700" />
          Tema de la semana completado
        </label>
        <label className="block space-y-2 text-sm font-medium">Notas <span className="font-normal text-ink/45">(opcional)</span>
          <textarea name="notas" rows={4} maxLength={5000} value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Acuerdos, observaciones o pendientes de esta semana…" className={input} />
        </label>
        {evidencia ? <div className="space-y-3">
          <a href={evidencia} target="_blank" rel="noreferrer" className="block w-fit">
            <Image src={evidencia} alt={`Evidencia de la semana ${registro.semana}`} width={480} height={320}
              unoptimized className="max-h-64 w-auto max-w-full rounded-xl object-contain" />
          </a>
          <label className="flex items-center gap-2 text-sm text-ink/65">
            <input type="checkbox" name="quitar_evidencia" /> Eliminar imagen actual
          </label>
        </div> : null}
        <label className="block space-y-2 text-sm font-medium">
          {evidencia ? "Reemplazar evidencia" : "Evidencia"} <span className="font-normal text-ink/45">(opcional)</span>
          <input type="file" name="evidencia" accept="image/jpeg,image/png,image/webp"
            className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-1 file:text-sm`}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              const error = archivo && archivo.size > MAX_EVIDENCIA_BYTES ? "La imagen debe pesar como máximo 3 MB." : undefined;
              e.target.setCustomValidity(error ?? "");
              setErrorArchivo(error);
            }} />
          <span className="block text-xs font-normal text-ink/50">JPG, PNG o WebP · máximo 3 MB. Una imagen nueva reemplaza la anterior.</span>
        </label>
        {errorArchivo ? <p role="alert" className="text-sm text-red-700">{errorArchivo}</p> : null}
        <button className={boton} disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar semana"}</button>
      </fieldset>
      <Resultado estado={estado} />
    </form>
  </details>;
}

export function EliminarMentoria({ id }: { id: string }) {
  const [estado, action, pendiente] = useActionState(eliminarMentoria, inicial);
  return <form action={action} onSubmit={(e) => {
    if (!confirm("¿Eliminar esta pareja y todo su seguimiento, notas y evidencias? Esta acción no se puede deshacer.")) e.preventDefault();
  }} className="mt-8 space-y-3 border-t border-black/10 pt-5">
    <input type="hidden" name="id" value={id} />
    <button disabled={pendiente} className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50">
      {pendiente ? "Eliminando…" : "Eliminar pareja"}
    </button>
    <Resultado estado={estado} />
  </form>;
}
