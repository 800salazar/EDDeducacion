# Educación

Plataforma ultra simple para que los miembros del capítulo consulten los
segmentos semanales, lean resúmenes ejecutivos y reciban **ideas accionables
según su giro** — sin login, sin fricción.

- **Miembros:** entran eligiendo su nombre en un dropdown. No hay contraseñas.
- **Admin (tú):** un solo panel en `/admin` protegido por una contraseña.

Stack: **Next.js 16** (App Router) · **Supabase** (DB + Storage) · **Tailwind v4** · listo para **Vercel**.

---

## 1. Configurar Supabase (una sola vez)

1. Crea un proyecto en <https://supabase.com>.
2. Ve a **SQL Editor → New query**, pega TODO el archivo
   [`supabase/schema.sql`](supabase/schema.sql) y dale **Run**.
   Esto crea las tablas, la seguridad (RLS), el bucket de archivos `media` y
   unos miembros de ejemplo.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public** key
   - **service_role** key (⚠️ secreta)

## 2. Variables de entorno

> 📋 Guía detallada (con los menús exactos de Supabase y cómo cargarlas en
> Vercel): **[`CONFIGURACION.md`](CONFIGURACION.md)**.

Copia `.env.example` a `.env.local` y llena los valores:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # secreta, solo servidor
ADMIN_PASSWORD=tu-contraseña-de-admin
```

## 3. Correr en local

```bash
npm install
npm run dev
```

- Portal de miembros: <http://localhost:3000>
- Panel de admin: <http://localhost:3000/admin>

---

## Flujo semanal (10–20 min)

1. Después de la reunión, en **ChatGPT** generas: resumen, ideas clave,
   transcript y las aplicaciones por giro.
2. Entras a `/admin` → **Nuevo segmento**:
   - Pones título, expositor, tema y fecha.
   - Subes el **PDF de slides** y el **audio** (o pegas un link de video).
   - Pegas el **resumen** y las **ideas clave**.
3. Dentro del segmento, en **“Cómo aplicarlo a tu negocio”**, agregas una
   aplicación por categoría (ej. `seguros`, `arquitectura`). Usa la categoría
   `general` para una versión que vean todos los giros.
4. Marcas **Publicado** y compartes el link por WhatsApp.

## Cómo funciona la personalización por giro

- Cada **miembro** tiene una `categoria` (ej. `seguros`).
- Cada **aplicación** de un segmento también tiene una `categoria`.
- Cuando un miembro abre un segmento, ve la aplicación de **su** categoría;
  si no existe, ve la de categoría `general`.

> Tip: no necesitas escribir una aplicación para cada giro cada semana.
> Con una `general` + 2-3 específicas para los giros presentes es suficiente.

---

## Desplegar en Vercel

1. Sube el proyecto a GitHub.
2. En <https://vercel.com> → **New Project** → importa el repo.
3. En **Settings → Environment Variables** agrega las 4 variables de
   `.env.local` (incluida `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PASSWORD`).
4. Deploy. Comparte la URL con el capítulo.

---

## Estructura

```
app/
  page.tsx                 Portal: el miembro elige su nombre
  (app)/                   Pantallas internas (header + footer compartidos)
    inicio/                Segmento de la semana + aplicación por giro
    historial/             Lista con búsqueda y filtro por tema
    segmentos/[id]/        Detalle del segmento + compartir por WhatsApp
  admin/                   Panel del coordinador (protegido por contraseña)
    page.tsx               Lista de segmentos
    segmentos/nuevo/       Crear segmento
    segmentos/[id]/        Editar segmento + aplicaciones por giro
    miembros/              Alta/edición/baja de miembros
    actions.ts             Server Actions (login + CRUD + subida de archivos)
lib/
  supabase/server.ts       Cliente de solo lectura (anon key)
  supabase/admin.ts        Cliente con service_role (escritura/uploads)
  data.ts                  Consultas públicas
  admin-data.ts            Consultas del panel
  auth.ts                  Login admin (cookie + contraseña)
  sesion-miembro.ts        "Sesión" del miembro sin login (cookie)
supabase/schema.sql        Esquema completo de la base de datos
```

## Seguridad

### Programa mentores (solo administrador)

En `/admin/mentores` puedes asignar un mentor y un mentoreado del listado de
miembros activos. Cada pareja tiene siete semanas independientes, con una casilla
de completado, notas opcionales (hasta 5,000 caracteres) y una imagen opcional
(JPG, PNG o WebP de hasta 3 MB). Un mentor puede participar en varias parejas.
La pareja exacta no se duplica y una persona no puede ser su propio mentor.

El módulo permite buscar por cualquiera de los dos nombres, paginar, marcar y
desmarcar semanas en la tabla, consultar el detalle y eliminar una pareja con
confirmación. Eliminar la pareja borra su seguimiento y sus imágenes; no borra
a los miembros. Un miembro que participa en mentorías no puede borrarse
accidentalmente: la base bloquea esa eliminación para conservar el historial.

**Instalación en un proyecto existente:** ejecuta únicamente
[`supabase/migrations/20261102224802_programa_mentores.sql`](supabase/migrations/20261102224802_programa_mentores.sql)
en el SQL Editor del proyecto Supabase de EDD. Para instalaciones nuevas, el
esquema completo `supabase/schema.sql` ya incluye el módulo.

Las tablas `mentorias` y `mentorias_semanas` tienen RLS y no conceden acceso a
`anon` ni `authenticated`. El servidor usa `service_role` después de comprobar
la cookie admin en cada lectura, acción y descarga. Las evidencias se guardan
en el bucket **privado** `mentores-evidencias` y se sirven por una ruta admin con
`Cache-Control: private, no-store`; nunca se crean URLs públicas ni firmadas.
No utiliza el bucket público `media`, no envía notificaciones y no añade datos
a perfiles, directorios o vistas de miembros. El acceso corresponde a cualquier
persona que tenga la contraseña actual de `/admin`.

Las siete semanas nacen con `false` en una transacción al crear la pareja.
Completar una semana no requiere notas, imagen ni semanas previas. Las casillas
de la tabla solo actualizan el booleano, conservando notas e imágenes. El detalle
comprueba `updated_at` para evitar sobrescribir una edición de otra ventana.
La nueva imagen se sube antes de guardar y la anterior se elimina solo cuando
la actualización se confirma. Si una subida queda sin guardar, se intenta
eliminar; fallos de limpieza se registran en el servidor para revisión.

Validación local: `npm run lint`, `npx tsc --noEmit`, `node --test tests/mentores.test.mjs`
y `npm run build`. La compilación requiere acceso a Google Fonts por la fuente
Inter existente. Después de aplicar la migración, verificar en EDD: varias
parejas del mismo mentor, notas y evidencia por semana, búsquedas, reemplazo y
eliminación de imagen, y rechazo de acceso sin sesión a la sección y a una URL
directa de evidencia.

Prueba SQL transaccional (sin conservar datos de prueba): ejecutar
`supabase/tests/mentores.sql` después de la migración. Comprueba permisos, RLS,
bucket privado, semanas iniciales, restricciones y conservación del historial.

### Acceso general

- Los miembros leen con la **anon key** y RLS permite **solo SELECT**.
- Toda escritura va por el servidor con **service_role** (nunca llega al
  navegador) y cada Server Action verifica que seas admin.
- El logo es texto; reemplázalo por el oficial editando
  [`components/Logo.tsx`](components/Logo.tsx).
</content>
