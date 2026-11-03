import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Ejecuta el código real aislando únicamente Next/Auth/Supabase. No toca EDD.
function cargar(ruta, dependencias = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const modulo = { exports: {} };
  const requerir = (nombre) => {
    if (nombre === "server-only") return {};
    if (!(nombre in dependencias)) throw new Error(`Dependencia sin aislar: ${nombre}`);
    return dependencias[nombre];
  };
  new Function("require", "module", "exports", outputText)(requerir, modulo, modulo.exports);
  return modulo.exports;
}

const constantes = cargar("lib/mentores.ts");
const pareja = "11111111-1111-4111-8111-111111111111";
const mentor = "22222222-2222-4222-8222-222222222222";
const miembro = "33333333-3333-4333-8333-333333333333";
const miembro2 = "44444444-4444-4444-8444-444444444444";
const version = "2026-11-02T12:00:00+00:00";
const rutaAnterior = `${pareja}/1/55555555-5555-4555-8555-555555555555.png`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=", "base64");

function entorno({ admin = true, respuestas = [], falloUpload = null, falloDownload = null } = {}) {
  const consultas = [], archivos = [], refrescos = [];
  const db = {
    from(tabla) {
      const consulta = { tabla, filtros: [] };
      consultas.push(consulta);
      let resultado;
      const terminar = () => {
        if (!resultado) {
          assert.ok(respuestas.length, `Consulta inesperada a ${tabla}`);
          resultado = respuestas.shift();
        }
        return Promise.resolve(resultado);
      };
      const builder = {
        select() { return builder; },
        insert(datos) { consulta.insert = datos; return builder; },
        update(datos) { consulta.update = datos; return builder; },
        delete() { consulta.delete = true; return builder; },
        eq(campo, valor) { consulta.filtros.push([campo, valor]); return builder; },
        in(campo, valor) { consulta.filtros.push([campo, valor]); return builder; },
        maybeSingle: terminar, single: terminar,
        then(resolve, reject) { return terminar().then(resolve, reject); },
      };
      return builder;
    },
    storage: { from(bucket) {
      assert.equal(bucket, "mentores-evidencias");
      return {
        async upload(ruta, buffer, opciones) { archivos.push({ accion: "subir", ruta, buffer, opciones }); return { error: falloUpload }; },
        async remove(rutas) { archivos.push({ accion: "eliminar", rutas }); return { error: null }; },
        async download(ruta) { archivos.push({ accion: "descargar", ruta }); return { data: new Blob([png], { type: "image/png" }), error: falloDownload }; },
      };
    } },
  };
  const dependencias = {
    "@/lib/auth": { esAdmin: async () => admin },
    "@/lib/supabase/admin": { createAdminClient: () => db },
    "@/lib/mentores": constantes,
    "next/cache": { revalidatePath: (p) => refrescos.push(p) },
    "next/navigation": { redirect: (p) => { throw new Error(`REDIRECT:${p}`); } },
  };
  return {
    acciones: cargar("app/admin/mentores/actions.ts", dependencias),
    evidencia: cargar("app/admin/mentores/[id]/evidencia/route.ts", dependencias),
    datos: cargar("lib/mentores-data.ts", dependencias),
    consultas, archivos, refrescos,
  };
}

function formulario(datos = {}, imagen) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ mentoria_id: pareja, semana: "1", version, notas: "", ...datos })) f.set(k, v);
  if (imagen) f.set("evidencia", imagen);
  return f;
}

test("sin sesión: bloquea todas las acciones, consultas e imágenes antes de acceder a datos", async () => {
  const e = entorno({ admin: false });
  for (const accion of [e.acciones.crearMentoria, e.acciones.guardarSemana, e.acciones.eliminarMentoria]) {
    assert.match((await accion({}, formulario())).error, /sesión/);
  }
  assert.match((await e.acciones.marcarSemana(pareja, 1, true)).error, /sesión/);
  for (const consulta of [() => e.datos.listarMentorias("", 1), () => e.datos.listarMiembrosMentores(), () => e.datos.obtenerMentoria(pareja)]) {
    await assert.rejects(consulta, /REDIRECT:\/admin/);
  }
  const r = await e.evidencia.GET(new Request("http://localhost/evidencia?semana=1"), { params: Promise.resolve({ id: pareja }) });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("cache-control"), /no-store/);
  assert.equal(e.consultas.length, 0);
  assert.equal(e.archivos.length, 0);
});

test("rechaza una pareja consigo mismo y miembros inválidos", async () => {
  const e = entorno();
  assert.match((await e.acciones.crearMentoria({}, formulario({ mentor_id: mentor, mentoreado_id: mentor }))).error, /distintas/);
  assert.match((await e.acciones.crearMentoria({}, formulario({ mentor_id: "x", mentoreado_id: miembro }))).error, /Selecciona/);
  assert.equal(e.consultas.length, 0);
});

test("rechaza miembros inactivos y comunica parejas duplicadas", async () => {
  const e = entorno({ respuestas: [{ data: [{ id: mentor }], error: null }] });
  assert.match((await e.acciones.crearMentoria({}, formulario({ mentor_id: mentor, mentoreado_id: miembro }))).error, /activos/);
  assert.equal(e.consultas.length, 1);
  const d = entorno({ respuestas: [{ data: [{ id: mentor }, { id: miembro }], error: null }, { data: null, error: { code: "23505" } }] });
  assert.match((await d.acciones.crearMentoria({}, formulario({ mentor_id: mentor, mentoreado_id: miembro }))).error, /ya está registrada/);
});

test("permite al mismo mentor crear dos parejas distintas", async () => {
  const e = entorno({ respuestas: [
    { data: [{ id: mentor }, { id: miembro }], error: null }, { data: { id: pareja }, error: null },
    { data: [{ id: mentor }, { id: miembro2 }], error: null }, { data: { id: miembro2 }, error: null },
  ] });
  for (const id of [miembro, miembro2]) await assert.rejects(
    () => e.acciones.crearMentoria({}, formulario({ mentor_id: mentor, mentoreado_id: id })), /REDIRECT:\/admin\/mentores\//,
  );
  assert.deepEqual(e.consultas.filter((q) => q.insert).map((q) => q.insert), [
    { mentor_id: mentor, mentoreado_id: miembro }, { mentor_id: mentor, mentoreado_id: miembro2 },
  ]);
});

test("marcar y desmarcar una semana preserva notas e imagen y solo afecta la pareja indicada", async () => {
  const e = entorno({ respuestas: [{ data: { semana: 7 }, error: null }, { data: { semana: 7 }, error: null }] });
  for (const valor of [true, false]) assert.equal((await e.acciones.marcarSemana(pareja, 7, valor)).error, undefined);
  assert.deepEqual(e.consultas.map((q) => q.update.completada), [true, false]);
  for (const q of e.consultas) {
    assert.deepEqual(Object.keys(q.update).sort(), ["completada", "updated_at"]);
    assert.deepEqual(q.filtros, [["mentoria_id", pareja], ["semana", 7]]);
  }
});

test("rechaza semanas fuera del programa y valores no booleanos", async () => {
  const e = entorno();
  for (const semana of [0, 8, 1.5, NaN]) assert.ok((await e.acciones.marcarSemana(pareja, semana, true)).error);
  assert.ok((await e.acciones.marcarSemana(pareja, 1, "true")).error);
  assert.equal(e.consultas.length, 0);
});

test("completa una semana sin notas ni imagen y permite notas en una semana pendiente", async () => {
  for (const [datos, esperada] of [[{ completada: "on" }, { completada: true, notas: null }], [{ notas: " Acuerdo pendiente " }, { completada: false, notas: "Acuerdo pendiente" }]]) {
    const e = entorno({ respuestas: [{ data: { evidencia_path: null, updated_at: version }, error: null }, { data: { semana: 1 }, error: null }] });
    assert.equal((await e.acciones.guardarSemana({}, formulario(datos))).error, undefined);
    assert.equal(e.consultas[1].update.completada, esperada.completada);
    assert.equal(e.consultas[1].update.notas, esperada.notas);
    assert.equal(e.consultas[1].update.evidencia_path, null);
    assert.equal(e.archivos.length, 0);
  }
});

test("reemplaza la evidencia solo después de confirmar el guardado", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: rutaAnterior, updated_at: version }, error: null }, { data: { semana: 1 }, error: null }] });
  assert.equal((await e.acciones.guardarSemana({}, formulario({ notas: "Reunión", completada: "on" }, new File([png], "reunion.png", { type: "image/png" })))).error, undefined);
  assert.equal(e.archivos[0].accion, "subir");
  assert.match(e.archivos[0].ruta, new RegExp(`^${pareja}/1/.+\\.png$`));
  assert.equal(e.consultas[1].update.evidencia_path, e.archivos[0].ruta);
  assert.deepEqual(e.archivos[1], { accion: "eliminar", rutas: [rutaAnterior] });
  assert.ok(e.consultas[1].filtros.some(([k, v]) => k === "updated_at" && v === version));
});

test("elimina una imagen opcional sin borrar notas", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: rutaAnterior, updated_at: version }, error: null }, { data: { semana: 1 }, error: null }] });
  assert.equal((await e.acciones.guardarSemana({}, formulario({ notas: "Conservar nota", quitar_evidencia: "on" }))).error, undefined);
  assert.equal(e.consultas[1].update.evidencia_path, null);
  assert.equal(e.consultas[1].update.notas, "Conservar nota");
  assert.deepEqual(e.archivos, [{ accion: "eliminar", rutas: [rutaAnterior] }]);
});

test("rechaza imágenes falsas y archivos de más de 3 MB", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: null, updated_at: version }, error: null }] });
  assert.match((await e.acciones.guardarSemana({}, formulario({}, new File(["<script>"], "fake.png", { type: "image/png" })))).error, /válida/);
  const grande = entorno();
  assert.match((await grande.acciones.guardarSemana({}, formulario({}, new File([new Uint8Array(constantes.MAX_EVIDENCIA_BYTES + 1)], "grande.png", { type: "image/png" })))).error, /3 MB/);
  assert.equal(grande.consultas.length, 0);
  assert.equal(e.archivos.length, 0);
});

test("una edición desactualizada no sube imágenes ni sobrescribe cambios", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: rutaAnterior, updated_at: "otra-version" }, error: null }] });
  assert.match((await e.acciones.guardarSemana({}, formulario({}, new File([png], "x.png", { type: "image/png" })))).error, /otra ventana/);
  assert.equal(e.consultas.length, 1);
  assert.equal(e.archivos.length, 0);
});

test("si falla el guardado tras subir, limpia solo la imagen nueva", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: rutaAnterior, updated_at: version }, error: null }, { data: null, error: null }] });
  assert.ok((await e.acciones.guardarSemana({}, formulario({}, new File([png], "x.png", { type: "image/png" })))).error);
  assert.deepEqual(e.archivos[1], { accion: "eliminar", rutas: [e.archivos[0].ruta] });
  assert.notEqual(e.archivos[0].ruta, rutaAnterior);
});

test("si falla la subida, no guarda una evidencia rota ni elimina la anterior", async () => {
  const e = entorno({ falloUpload: { message: "sin espacio" }, respuestas: [{ data: { evidencia_path: rutaAnterior, updated_at: version }, error: null }] });
  assert.match((await e.acciones.guardarSemana({}, formulario({}, new File([png], "x.png", { type: "image/png" })))).error, /subir/);
  assert.equal(e.consultas.length, 1);
  assert.equal(e.archivos.length, 1);
});

test("evidencia requiere una ruta de la pareja y semana solicitadas", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: `${miembro}/1/otro.png` }, error: null }] });
  const r = await e.evidencia.GET(new Request("http://localhost/evidencia?semana=1"), { params: Promise.resolve({ id: pareja }) });
  assert.equal(r.status, 404);
  assert.equal(e.archivos.length, 0);
});

test("la descarga admin entrega bytes con no-store, Vary Cookie y sin URL pública", async () => {
  const e = entorno({ respuestas: [{ data: { evidencia_path: rutaAnterior }, error: null }] });
  const r = await e.evidencia.GET(new Request("http://localhost/evidencia?semana=1"), { params: Promise.resolve({ id: pareja }) });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/png");
  assert.match(r.headers.get("cache-control"), /private, no-store/);
  assert.equal(r.headers.get("vary"), "Cookie");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await r.arrayBuffer()), png);
});

test("eliminar pareja no elimina miembros y limpia las evidencias asociadas", async () => {
  const e = entorno({ respuestas: [{ data: [{ evidencia_path: rutaAnterior }, { evidencia_path: null }], error: null }, { data: null, error: null }] });
  await assert.rejects(() => e.acciones.eliminarMentoria({}, formulario({ id: pareja })), /REDIRECT:\/admin\/mentores/);
  assert.deepEqual(e.consultas.map((q) => q.tabla), ["mentorias_semanas", "mentorias"]);
  assert.equal(e.consultas[1].delete, true);
  assert.deepEqual(e.archivos, [{ accion: "eliminar", rutas: [rutaAnterior] }]);
});
