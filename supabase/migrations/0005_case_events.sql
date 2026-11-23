create table case_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  actor_id uuid references staff(id) on delete set null,
  event_type text not null check (event_type in ('creado','asignado','estado','nota','acceso_contacto')),
  detail text,
  created_at timestamptz default now()
);
create index case_events_report_idx on case_events(report_id);
