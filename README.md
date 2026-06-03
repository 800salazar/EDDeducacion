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

- Los miembros leen con la **anon key** y RLS permite **solo SELECT**.
- Toda escritura va por el servidor con **service_role** (nunca llega al
  navegador) y cada Server Action verifica que seas admin.
- El logo es texto; reemplázalo por el oficial editando
  [`components/Logo.tsx`](components/Logo.tsx).
</content>
