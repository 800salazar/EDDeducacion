-- ============================================================================
-- BNI Emprendedores del Desierto Insights — Esquema de base de datos
-- ----------------------------------------------------------------------------
-- Cómo usarlo:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Menú izquierdo → SQL Editor → New query
--   3. Pega TODO este archivo y dale "Run".
-- Es idempotente: lo puedes correr varias veces sin romper nada.
-- ============================================================================

-- ---------- Extensiones ----------
create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ---------- Tabla: miembros ----------
-- Cada persona del capítulo. NO hay login: el portal solo los lista en un
-- dropdown. "categoria" es la llave que conecta con las aplicaciones por giro.
create table if not exists public.miembros (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  empresa     text,
  giro        text not null,           -- etiqueta visible, ej. "Agente de seguros"
  categoria   text not null,           -- llave que liga con aplicaciones, ej. "seguros"
  activo      boolean not null default true,
  orden       int not null default 0,  -- para ordenar el dropdown a tu gusto
  created_at  timestamptz not null default now()
);

-- ---------- Tabla: segmentos ----------
-- El contenido semanal (el tema visto en la reunión).
create table if not exists public.segmentos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  expositor   text,
  tema        text,                    -- categoría/tema, ej. "Referrals", "Networking"
  fecha       date not null default current_date,
  resumen     text,                    -- resumen ejecutivo (lo pegas de ChatGPT)
  transcript  text,                    -- transcript completo (opcional)
  ideas_clave text,                    -- bullets de ideas clave (opcional)
  slides_url  text,                    -- URL pública del PDF/imagen en Storage
  audio_url   text,                    -- URL pública del audio en Storage
  video_url   text,                    -- link a YouTube/Vimeo/etc (opcional)
  publicado   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists segmentos_fecha_idx on public.segmentos (fecha desc);

-- ---------- Tabla: aplicaciones ----------
-- "Cómo aplicarlo a tu negocio", por categoría/giro. Este es el valor diferencial.
-- Usa categoria = 'general' para una versión que vean TODOS los giros cuando no
-- exista una específica para su categoría.
create table if not exists public.aplicaciones (
  id           uuid primary key default gen_random_uuid(),
  segmento_id  uuid not null references public.segmentos(id) on delete cascade,
  categoria    text not null,          -- 'seguros', 'arquitectura'... o 'general'
  contenido    text not null,          -- texto/markdown con acciones, referrals, etc.
  created_at   timestamptz not null default now(),
  unique (segmento_id, categoria)
);

create index if not exists aplicaciones_segmento_idx on public.aplicaciones (segmento_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
-- Los miembros NO tienen cuenta: leen con la "anon key" del navegador.
-- Por eso permitimos SELECT público, pero NUNCA escritura pública.
-- Las escrituras (admin) se hacen desde el servidor con la "service_role key",
-- que ignora RLS por completo.
-- ============================================================================
alter table public.miembros     enable row level security;
alter table public.segmentos    enable row level security;
alter table public.aplicaciones enable row level security;

-- Lectura pública (anon + authenticated)
drop policy if exists "lectura publica miembros" on public.miembros;
create policy "lectura publica miembros"
  on public.miembros for select using (true);

drop policy if exists "lectura publica segmentos" on public.segmentos;
create policy "lectura publica segmentos"
  on public.segmentos for select using (true);

drop policy if exists "lectura publica aplicaciones" on public.aplicaciones;
create policy "lectura publica aplicaciones"
  on public.aplicaciones for select using (true);

-- (No creamos policies de INSERT/UPDATE/DELETE: quedan bloqueadas para el público.
--  El panel /admin escribe con service_role, que salta RLS.)

-- ============================================================================
-- Storage: bucket público "media" para PDFs, imágenes y audio
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Lectura pública de los archivos del bucket
drop policy if exists "lectura publica media" on storage.objects;
create policy "lectura publica media"
  on storage.objects for select
  using (bucket_id = 'media');
-- (La subida de archivos se hace desde el servidor con service_role.)

-- ============================================================================
-- Datos de ejemplo (puedes borrarlos cuando agregues los reales desde /admin)
-- ============================================================================
insert into public.miembros (nombre, empresa, giro, categoria, orden) values
  ('Juan Pérez',     'Seguros del Norte',     'Agente de seguros',  'seguros',      1),
  ('María López',    'Estudio LM Arquitectura','Arquitecta',         'arquitectura', 2),
  ('Pedro Ramírez',  'Impulso Marketing',     'Marketing digital',  'marketing',    3),
  ('Ana Torres',     'Torres Contadores',     'Contadora',          'contabilidad', 4)
on conflict do nothing;
