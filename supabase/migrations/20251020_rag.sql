-- RAG Subsystem for Project Foundry
-- Hybrid retrieval: 0.7 vector + 0.3 full-text
-- Embedding model: text-embedding-3-small (1536 dimensions)

-- Enable pgvector extension
create extension if not exists vector;

-- Organizations table
create table if not exists organizations(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Organization members for RLS
create table if not exists org_members(
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  primary key (org_id, user_id)
);

-- Documents table (deduplicated by SHA-256)
create table if not exists documents(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  source_url text,
  source_type text not null,      -- 'md'|'pdf'|'docx'|'html'|'txt'
  mime text,
  sha256 text,
  bytes int,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(org_id, sha256)
);

-- Document chunks with embeddings
create table if not exists doc_chunks(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  doc_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int not null,
  embedding vector(1536),
  ts tsvector generated always as (to_tsvector('english', coalesce(content,''))) stored,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Query log for analytics
create table if not exists rag_queries(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid,
  query_text text not null,
  top_k int not null,
  used_hybrid boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists doc_chunks_org on doc_chunks(org_id);
create index if not exists doc_chunks_doc on doc_chunks(doc_id);
create index if not exists doc_chunks_ts_idx on doc_chunks using gin(ts);

-- Vector index (HNSW for approximate nearest neighbor - supports >2000 dimensions)
create index if not exists doc_chunks_embedding_hnsw
  on doc_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Enable RLS
alter table documents enable row level security;
alter table doc_chunks enable row level security;
alter table rag_queries enable row level security;

-- RLS Policies (org-scoped)
create policy "org members read documents"
  on documents for select using (
    exists (select 1 from org_members m where m.org_id = documents.org_id and m.user_id = auth.uid())
  );

create policy "org members read chunks"
  on doc_chunks for select using (
    exists (select 1 from org_members m where m.org_id = doc_chunks.org_id and m.user_id = auth.uid())
  );

create policy "org members insert rag queries"
  on rag_queries for insert with check (
    exists (select 1 from org_members m where m.org_id = rag_queries.org_id and m.user_id = auth.uid())
  );

-- Service role can do everything (for ingestion scripts)
create policy "service role full access documents"
  on documents for all using (true);

create policy "service role full access chunks"
  on doc_chunks for all using (true);

-- Vector-only search RPC
create or replace function match_chunks_vector(
  p_org_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 12
) returns table(
  chunk_id uuid,
  doc_id uuid,
  content text,
  similarity float4,
  metadata jsonb
) language sql stable as $$
  select
    c.id as chunk_id,
    c.doc_id,
    c.content,
    (1 - (c.embedding <=> p_query_embedding))::float4 as similarity,
    c.metadata
  from doc_chunks c
  where c.org_id = p_org_id
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- Hybrid search RPC (0.7 vector + 0.3 full-text)
create or replace function match_chunks_hybrid(
  p_org_id uuid,
  p_query text,
  p_query_embedding vector(1536),
  p_match_count int default 12
) returns table(
  chunk_id uuid,
  doc_id uuid,
  content text,
  hybrid_score float4,
  vec_sim float4,
  ft_rank float4,
  metadata jsonb
) language sql stable as $$
with vec as (
  select
    c.id,
    c.doc_id,
    c.content,
    c.ts,
    c.metadata,
    (1 - (c.embedding <=> p_query_embedding))::float4 as vec_sim
  from doc_chunks c
  where c.org_id = p_org_id
  order by c.embedding <=> p_query_embedding
  limit greatest(p_match_count * 5, 50)
),
ft as (
  select
    v.*,
    ts_rank_cd(v.ts, plainto_tsquery('english', p_query))::float4 as ft_rank
  from vec v
)
select
  id as chunk_id,
  doc_id,
  content,
  (0.7 * vec_sim + 0.3 * (least(ft_rank, 1.5) / 1.5))::float4 as hybrid_score,
  vec_sim,
  ft_rank,
  metadata
from ft
order by hybrid_score desc
limit p_match_count;
$$;

-- Helper: Get document info for chunks
create or replace function get_chunk_documents(
  p_chunk_ids uuid[]
) returns table(
  chunk_id uuid,
  doc_id uuid,
  doc_title text,
  source_url text,
  source_type text
) language sql stable as $$
  select
    c.id as chunk_id,
    d.id as doc_id,
    d.title as doc_title,
    d.source_url,
    d.source_type
  from doc_chunks c
  join documents d on d.id = c.doc_id
  where c.id = any(p_chunk_ids);
$$;

-- Create default org for single-tenant dev mode
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Default Organization')
on conflict (id) do nothing;

comment on table documents is 'Source documents ingested for RAG';
comment on table doc_chunks is 'Chunked content with embeddings for retrieval';
comment on table rag_queries is 'Query log for analytics and debugging';
comment on function match_chunks_hybrid is 'Hybrid search: 0.7 vector similarity + 0.3 full-text rank';
