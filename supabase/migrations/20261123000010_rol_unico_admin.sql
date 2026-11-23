-- Un solo rol en el panel: «admin» (hace todo lo de la coordinadora y la gestora).

-- 1. Todo el personal pasa a admin.
update staff set role = 'admin' where role is distinct from 'admin';

-- 2. Quita cualquier check anterior sobre role (sea cual sea su nombre) y deja solo 'admin'.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.staff'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.staff drop constraint %I', c.conname);
  end loop;
end $$;

alter table staff add constraint staff_role_check check (role = 'admin');
alter table staff alter column role set default 'admin';
