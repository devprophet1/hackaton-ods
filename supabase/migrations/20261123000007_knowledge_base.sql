create table kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  status text not null default 'procesando' check (status in ('procesando','procesado','error')),
  chunk_count int default 0,
  uploaded_by uuid references staff(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references kb_documents(id) on delete cascade,
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

create or replace function match_chunks(query_embedding vector(768), match_count int default 5, min_similarity float default 0.5)
returns table (id uuid, content text, document_title text, source text, similarity float)
language sql stable as $$
  select c.id, c.content, d.title, d.source, 1 - (c.embedding <=> query_embedding) as similarity
  from kb_chunks c join kb_documents d on d.id = c.document_id
  where d.status = 'procesado' and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
