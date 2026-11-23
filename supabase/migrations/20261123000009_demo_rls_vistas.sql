-- Marca de datos de demostración: el seed borra y recrea solo estas filas.
alter table reports add column is_demo boolean not null default false;
create index reports_is_demo_idx on reports(is_demo) where is_demo;

-- Reportes por día en los últimos 7 días, en hora de Lima (America/Lima).
create view reports_last_7_days with (security_invoker = true) as
with days as (
  select generate_series(
    (now() at time zone 'America/Lima')::date - 6,
    (now() at time zone 'America/Lima')::date,
    interval '1 day'
  )::date as day
)
select d.day, count(r.id)::int as total
from days d
left join reports r on (r.created_at at time zone 'America/Lima')::date = d.day
group by d.day
order by d.day;

-- La vista existente respeta los permisos de quien consulta.
alter view violence_type_counts set (security_invoker = true);

-- Búsqueda aproximada por similitud coseno (match_chunks usa el operador <=>).
create index kb_chunks_embedding_hnsw on kb_chunks using hnsw (embedding vector_cosine_ops);

-- RLS activado sin políticas: anon y authenticated no ven nada; solo el backend
-- con la secret key (service_role, que omite RLS) accede a los datos.
alter table staff enable row level security;
alter table reports enable row level security;
alter table persons enable row level security;
alter table case_events enable row level security;
alter table consents enable row level security;
alter table kb_documents enable row level security;
alter table kb_chunks enable row level security;
