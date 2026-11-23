create table reports (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  is_anonymous boolean not null default true,
  device_safe text check (device_safe in ('si','no','no_seguro')),
  danger text check (danger in ('si','no','no_se')),
  has_risk boolean not null default false,
  violence_types text[] default '{}',
  place text,
  description text,
  support_types text[] default '{}',
  status text not null default 'pendiente'
    check (status in ('pendiente','contactado','derivado_cem','derivado_comisaria','cerrado')),
  derived_to text check (derived_to in ('cem','comisaria')),
  assigned_to uuid references staff(id) on delete set null,
  first_contact_at timestamptz,
  created_at timestamptz default now()
);
create index reports_status_idx on reports(status);
