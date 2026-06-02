# Configuración — variables de entorno

Guía para dejar la app funcionando en **local** y en **producción (Vercel)**.
Son **4 variables**. 3 las copias de Supabase y 1 la inventas tú.

## Resumen de las 4 variables

| Variable | Dónde se consigue | ¿Secreta? | ¿Visible en navegador? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → **Project URL** | No | Sí (normal) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → **anon / public** (o *Publishable key*) | No | Sí (normal) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → **service_role** (o *Secret key*) | ⚠️ **Sí** | **No, nunca** |
| `ADMIN_PASSWORD` | La inventas tú | ⚠️ **Sí** | **No, nunca** |

> Las que empiezan con `NEXT_PUBLIC_` se exponen al navegador **a propósito**
> (la URL y la anon key no son secretas: la seguridad la da RLS, que solo
> permite leer). Las otras dos **jamás** llevan ese prefijo.

---

## Parte A — Supabase (una sola vez)

1. Entra a tu proyecto en <https://supabase.com>.

2. **Corre el esquema de la base de datos:**
   - Menú izquierdo → **SQL Editor** → **New query**.
   - Abre el archivo [`supabase/schema.sql`](supabase/schema.sql), copia **todo**
     su contenido, pégalo y dale **Run**.
   - Esto crea las tablas, la seguridad (RLS), el bucket `media` y unos miembros
     de ejemplo. (En Supabase **no** se cargan variables de entorno; solo corres
     este SQL y copias las llaves.)

3. **Copia la URL del proyecto:**
   - Engranaje **Project Settings** → **Data API**.
   - Copia **Project URL** → es tu `NEXT_PUBLIC_SUPABASE_URL`.

4. **Copia las llaves:**
   - **Project Settings** → **API Keys**.
   - Si ves una pestaña **“Legacy API keys”**:
     - `anon` / `public`  →  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role`     →  `SUPABASE_SERVICE_ROLE_KEY`  ⚠️ secreta
   - Si tu panel ya usa el sistema nuevo de llaves:
     - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Secret key** (`sb_secret_...`)           → `SUPABASE_SERVICE_ROLE_KEY` ⚠️
   - Las dos formas funcionan con esta app.

---

## Parte B — Local (tu computadora)

1. Crea tu archivo a partir de la plantilla:
   ```bash
   cp .env.example .env.local
   ```
2. Abre `.env.local` y pega los 3 valores de Supabase + inventa tu
   `ADMIN_PASSWORD`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon / publishable
   SUPABASE_SERVICE_ROLE_KEY=eyJ...       # service_role / secret  (SECRETA)
   ADMIN_PASSWORD=MiClaveFuerte2026!
   ```
3. Arranca:
   ```bash
   npm install
   npm run dev
   ```
   - Miembros: <http://localhost:3000>
   - Admin: <http://localhost:3000/admin>

> `.env.local` está en `.gitignore`: no se sube a git. ✔️

---

## Parte C — Vercel (producción)

### Opción 1: desde el panel de Vercel (recomendado)

1. <https://vercel.com> → tu proyecto → **Settings** → **Environment Variables**.
2. Agrega las **4 variables** (una por una). Por cada una:
   - **Key**: el nombre exacto (ej. `NEXT_PUBLIC_SUPABASE_URL`).
   - **Value**: el valor.
   - **Environments**: deja marcados **Production**, **Preview** y **Development**.
   - **Save**.
3. Cuando termines, ve a **Deployments** → menú “···” del último deploy →
   **Redeploy** (las variables nuevas solo aplican tras un redeploy).

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role / secret key |
| `ADMIN_PASSWORD` | tu contraseña de admin |

### Opción 2: desde la terminal (Vercel CLI)

```bash
npm i -g vercel
vercel login
vercel link                      # conecta esta carpeta con tu proyecto Vercel

vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ADMIN_PASSWORD
# (cada comando te pide el valor y en qué entornos: elige Production/Preview/Development)

vercel --prod                    # redeploy a producción
```

> Truco: si ya tienes `.env.local` lleno, puedes subir todo de una con
> `vercel env pull` / importarlo desde el panel; pero agregar las 4 a mano es
> rápido y evita subir secretos por error.

---

## Errores comunes

- **“Faltan NEXT_PUBLIC_SUPABASE_URL…”** → no llenaste `.env.local` (local) o no
  agregaste las variables en Vercel. En Vercel, recuerda **redeploy** después.
- **Los miembros no cargan / 500** → ¿corriste `supabase/schema.sql`?
- **No puedo entrar a /admin** → revisa `ADMIN_PASSWORD` (debe ser idéntica en
  el entorno donde estás probando).
- **Subir archivos falla** → confirma que el SQL creó el bucket `media`
  (lo crea automáticamente al correr `schema.sql`).
