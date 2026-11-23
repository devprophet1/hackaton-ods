-- Seguimiento de casos sin asignación a personal: 4 estados, persona de contacto y entidad de derivación.
-- La columna assigned_to se conserva (queda sin uso) y no se borra ningún evento del historial.

-- 1. Nuevas columnas.
alter table reports add column if not exists contact_person text;   -- quién contacta a la persona
alter table reports add column if not exists derived_entity text;   -- nombre de la entidad cuando derived_to = 'otra'

-- 2. Quita los checks anteriores de status y derived_to (sea cual sea su nombre).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.reports'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%status%' or pg_get_constraintdef(oid) ilike '%derived_to%')
  loop
    execute format('alter table public.reports drop constraint %I', c.conname);
  end loop;
end $$;

-- 3. Datos: derivado_cem / derivado_comisaria → derivado; comisaria → policia.
update reports set derived_to = 'cem' where status = 'derivado_cem' and derived_to is null;
update reports set derived_to = 'comisaria' where status = 'derivado_comisaria' and derived_to is null;
update reports set status = 'derivado' where status in ('derivado_cem', 'derivado_comisaria');
update reports set derived_to = 'policia' where derived_to = 'comisaria';

-- 4. Checks nuevos.
alter table reports add constraint reports_status_check check (status in ('pendiente','contactado','derivado','cerrado'));
alter table reports add constraint reports_derived_to_check check (derived_to in ('cem','policia','otra'));
