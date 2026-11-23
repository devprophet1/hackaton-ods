-- Solo existe si la persona desactivó el modo anónimo
create table persons (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references reports(id) on delete cascade,
  alias text,
  contact_method text check (contact_method in ('sms','whatsapp','llamada')),
  contact_value text,
  safe_schedule text,
  created_at timestamptz default now()
);
