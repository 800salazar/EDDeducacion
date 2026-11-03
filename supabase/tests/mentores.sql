-- Ejecutar DESPUÉS de aplicar la migración. Todo se revierte al finalizar.
begin;
do $$
declare
  v_mentor uuid;
  v_uno uuid;
  v_dos uuid;
  v_pareja uuid;
  v_otra uuid;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.mentorias'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.mentorias_semanas'::regclass) then
    raise exception 'Falta RLS en las tablas de mentorías';
  end if;
  if has_table_privilege('anon', 'public.mentorias', 'select')
    or has_table_privilege('authenticated', 'public.mentorias', 'select')
    or has_table_privilege('anon', 'public.mentorias_semanas', 'select')
    or has_table_privilege('authenticated', 'public.mentorias_semanas', 'select') then
    raise exception 'Las tablas no deben conceder lectura pública';
  end if;
  if not exists (select 1 from storage.buckets where id = 'mentores-evidencias'
      and public = false and file_size_limit = 3145728) then
    raise exception 'Falta el bucket privado con su límite';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage'
      and tablename = 'objects' and policyname = 'mentores evidencias solo servidor'
      and permissive = 'RESTRICTIVE') then
    raise exception 'Falta la policy restrictiva del bucket';
  end if;

  insert into public.miembros (nombre, giro, categoria)
  values ('Prueba mentor ' || gen_random_uuid(), 'Prueba', 'prueba') returning id into v_mentor;
  insert into public.miembros (nombre, giro, categoria)
  values ('Prueba mentoreado ' || gen_random_uuid(), 'Prueba', 'prueba') returning id into v_uno;
  insert into public.miembros (nombre, giro, categoria)
  values ('Prueba mentoreado ' || gen_random_uuid(), 'Prueba', 'prueba') returning id into v_dos;

  insert into public.mentorias (mentor_id, mentoreado_id)
  values (v_mentor, v_uno) returning id into v_pareja;
  insert into public.mentorias (mentor_id, mentoreado_id)
  values (v_mentor, v_dos) returning id into v_otra;
  if (select count(*) from public.mentorias_semanas where mentoria_id = v_pareja) <> 7
    or exists (select 1 from public.mentorias_semanas where mentoria_id = v_pareja
      and (completada or notas is not null or evidencia_path is not null)) then
    raise exception 'La pareja debe iniciar con siete semanas pendientes';
  end if;
  begin
    insert into public.mentorias (mentor_id, mentoreado_id) values (v_mentor, v_mentor);
    raise exception 'Se permitió una pareja consigo mismo';
  exception when check_violation then null;
  end;
  begin
    insert into public.mentorias (mentor_id, mentoreado_id) values (v_mentor, v_uno);
    raise exception 'Se permitió duplicar una pareja';
  exception when unique_violation then null;
  end;
  begin
    insert into public.mentorias_semanas (mentoria_id, semana) values (v_pareja, 8);
    raise exception 'Se permitió una semana fuera de 1–7';
  exception when check_violation then null;
  end;
  update public.mentorias_semanas set completada = true, notas = 'Prueba'
  where mentoria_id = v_pareja and semana = 7;
  if exists (select 1 from public.mentorias_semanas where mentoria_id = v_otra and completada) then
    raise exception 'Se mezcló el avance de distintas parejas';
  end if;
  begin
    delete from public.miembros where id = v_mentor;
    raise exception 'Se permitió borrar un miembro con historial';
  exception when foreign_key_violation then null;
  end;
  update public.miembros set activo = false where id = v_uno;
  if not exists (select 1 from public.mentorias where id = v_pareja) then
    raise exception 'Inactivar un miembro eliminó su historial';
  end if;
  delete from public.mentorias where id = v_pareja;
  if exists (select 1 from public.mentorias_semanas where mentoria_id = v_pareja) then
    raise exception 'Eliminar la pareja no eliminó sus semanas';
  end if;
  raise notice 'Programa mentores: verificaciones SQL correctas. Los datos de prueba se revierten.';
end;
$$;
rollback;
