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

-- ---------- Tabla: album_estampas ----------
-- Álbum mundialista de uno a unos. Cada miembro conserva una sola foto por
-- cada otro miembro activo del capítulo.
create table if not exists public.album_estampas (
  id                  uuid primary key default gen_random_uuid(),
  miembro_id          uuid not null references public.miembros(id) on delete cascade,
  objetivo_miembro_id uuid not null references public.miembros(id) on delete cascade,
  foto_url            text not null,
  storage_path        text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (miembro_id, objetivo_miembro_id),
  check (miembro_id <> objetivo_miembro_id)
);

create index if not exists album_estampas_miembro_idx
  on public.album_estampas (miembro_id);

-- ---------- Perfil público de miembro ----------
-- Cada miembro recibe un perfil con una URL pública. El usuario puede cambiar
-- su identificador, pero se crea uno inicial estable para que el catálogo de
-- invitados tenga una liga desde el primer día.
create table if not exists public.perfiles_miembro (
  id                       uuid primary key default gen_random_uuid(),
  miembro_id               uuid not null unique references public.miembros(id) on delete cascade,
  usuario                  text not null unique,
  foto_url                 text,
  foto_storage_path        text,
  logo_empresa_url         text,
  logo_empresa_storage_path text,
  color_principal          text check (color_principal is null or color_principal ~ '^#[0-9A-Fa-f]{6}$'),
  link_formato_uno_a_uno   text,
  facebook_url             text,
  instagram_url            text,
  linkedin_url             text,
  pagina_web_url           text,
  acerca_de_mi             text check (char_length(acerca_de_mi) <= 500),
  mascotas                 text check (char_length(mascotas) <= 180),
  familia                  text check (char_length(familia) <= 180),
  pasatiempos              text check (char_length(pasatiempos) <= 180),
  otros_intereses          text check (char_length(otros_intereses) <= 180),
  ciudad                   text check (char_length(ciudad) <= 120),
  trabajos_anteriores      text check (char_length(trabajos_anteriores) <= 220),
  habilidades              text check (char_length(habilidades) <= 400),
  objetivos                text check (char_length(objetivos) <= 400),
  redes                    text check (char_length(redes) <= 400),
  logros                   text check (char_length(logros) <= 400),
  intereses                text check (char_length(intereses) <= 400),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (usuario ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  check (usuario not in (
    'admin', 'album', 'api', 'historial', 'inicio', 'invitados', 'perfil',
    'segmentos', 'opengraph-image', 'twitter-image'
  ))
);

-- Compatibilidad para instalaciones que ya ejecutaron la primera versión del
-- perfil público antes de que se añadieran el color y el logotipo.
alter table public.perfiles_miembro
  add column if not exists logo_empresa_url text,
  add column if not exists logo_empresa_storage_path text,
  add column if not exists color_principal text;

alter table public.perfiles_miembro
  drop constraint if exists perfiles_miembro_color_principal_check;
alter table public.perfiles_miembro
  add constraint perfiles_miembro_color_principal_check
  check (color_principal is null or color_principal ~ '^#[0-9A-Fa-f]{6}$');

create index if not exists perfiles_miembro_usuario_idx
  on public.perfiles_miembro (usuario);

-- Listas editables del perfil: clientes buscados, contactos y mejores clientes.
create table if not exists public.perfil_lista_items (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles_miembro(id) on delete cascade,
  tipo        text not null check (tipo in ('clientes_buscados', 'contactos', 'mejores_clientes')),
  contenido   text not null check (char_length(contenido) <= 180),
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  unique (perfil_id, tipo, orden)
);

create index if not exists perfil_lista_items_perfil_tipo_idx
  on public.perfil_lista_items (perfil_id, tipo, orden);

create or replace function public.perfil_usuario_inicial(nombre text, miembro uuid)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        translate(lower(coalesce(nombre, '')),
          'áàäâéèëêíìïîóòöôúùüûñç',
          'aaaaeeeeiiiioooouuuunc'
        ),
        '[^a-z0-9]+', '-', 'g'
      )),
      ''
    ),
    'miembro'
  ) || '-' || left(replace(miembro::text, '-', ''), 6);
$$;

create or replace function public.crear_perfil_para_miembro()
returns trigger
language plpgsql
as $$
begin
  insert into public.perfiles_miembro (miembro_id, usuario)
  values (new.id, public.perfil_usuario_inicial(new.nombre, new.id))
  on conflict (miembro_id) do nothing;
  return new;
end;
$$;

drop trigger if exists perfiles_miembro_crear_por_miembro on public.miembros;
create trigger perfiles_miembro_crear_por_miembro
  after insert on public.miembros
  for each row execute function public.crear_perfil_para_miembro();

insert into public.perfiles_miembro (miembro_id, usuario)
select m.id, public.perfil_usuario_inicial(m.nombre, m.id)
from public.miembros m
left join public.perfiles_miembro p on p.miembro_id = m.id
where p.id is null
on conflict (miembro_id) do nothing;

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
alter table public.album_estampas enable row level security;
alter table public.perfiles_miembro enable row level security;
alter table public.perfil_lista_items enable row level security;

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

drop policy if exists "lectura publica album_estampas" on public.album_estampas;
create policy "lectura publica album_estampas"
  on public.album_estampas for select using (true);

-- Los perfiles se leen desde páginas del servidor con service_role. Así, cuando
-- alguien comparte solamente su liga externa, sus campos personales no quedan
-- expuestos por la API pública de Supabase.

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
-- Sin datos de ejemplo por defecto
-- ----------------------------------------------------------------------------
-- La carga inicial de miembros se hace desde /admin o vía importación CSV,
-- para evitar duplicados con datos reales del capítulo.
-- ============================================================================
