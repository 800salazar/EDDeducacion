-- Control exclusivo del administrador; NO otorga permisos al portal de miembros.
begin;

create table if not exists public.mentorias (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.miembros(id) on delete restrict,
  mentoreado_id uuid not null references public.miembros(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint mentorias_miembros_distintos check (mentor_id <> mentoreado_id),
  constraint mentorias_pareja_unica unique (mentor_id, mentoreado_id)
);
create index if not exists mentorias_mentoreado_idx on public.mentorias (mentoreado_id);
create index if not exists mentorias_creacion_idx on public.mentorias (created_at desc, id);

create table if not exists public.mentorias_semanas (
  mentoria_id uuid not null references public.mentorias(id) on delete cascade,
  semana smallint not null check (semana between 1 and 7),
  completada boolean not null default false,
  notas text check (char_length(notas) <= 5000),
  evidencia_path text,
  updated_at timestamptz not null default now(),
  primary key (mentoria_id, semana),
  constraint mentorias_evidencia_ruta check (
    evidencia_path is null or evidencia_path ~ (
      '^' || mentoria_id::text || '/' || semana::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$'
    )
  )
);

-- Las siete semanas se crean en la misma transacción que la pareja.
create or replace function public.inicializar_semanas_mentoria()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.mentorias_semanas (mentoria_id, semana)
  select new.id, generate_series(1, 7);
  return new;
end;
$$;
revoke all on function public.inicializar_semanas_mentoria() from public, anon, authenticated;
grant execute on function public.inicializar_semanas_mentoria() to service_role;
drop trigger if exists mentorias_crear_semanas on public.mentorias;
create trigger mentorias_crear_semanas after insert on public.mentorias
for each row execute function public.inicializar_semanas_mentoria();

alter table public.mentorias enable row level security;
alter table public.mentorias_semanas enable row level security;
revoke all on public.mentorias, public.mentorias_semanas from public, anon, authenticated;
grant select, insert, update, delete on public.mentorias, public.mentorias_semanas to service_role;
-- Sin policies públicas: solo el servidor, tras validar la cookie admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mentores-evidencias', 'mentores-evidencias', false, 3145728,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
-- Sin policies públicas para este bucket. Las imágenes pasan por una ruta admin.
-- Restrictiva: protege este bucket incluso si existe otra policy permisiva global.
drop policy if exists "mentores evidencias solo servidor" on storage.objects;
create policy "mentores evidencias solo servidor" on storage.objects
as restrictive for all to anon, authenticated
using (bucket_id <> 'mentores-evidencias')
with check (bucket_id <> 'mentores-evidencias');

commit;
