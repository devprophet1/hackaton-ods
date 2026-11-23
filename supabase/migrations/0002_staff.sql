create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('coordinadora','gestora','admin')),
  institution text default 'CEM Villa El Salvador (demo)',
  created_at timestamptz default now()
);
