create table consents (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  purpose text not null,
  granted boolean not null,
  created_at timestamptz default now()
);
