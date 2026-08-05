-- ============================================================
-- Migración 0004: reseñas de clientes + avances del día a día
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- (después de 0003)
-- ============================================================

create extension if not exists "pgcrypto";

-- Reseñas / testimonios de clientes
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  detail      text,
  review      text not null,
  rating      int not null default 5 check (rating between 1 and 5),
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Avances / novedades del taller (fotos y videos del proceso de cada pedido)
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  body        text,
  media_url   text not null,
  media_type  text not null default 'image' check (media_type in ('image', 'video')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reviews_active_idx on public.reviews (active);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists posts_active_idx on public.posts (active);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: el público SOLO lee los activos. Las escrituras y lecturas
-- admin van por el service role (servidor), que salta RLS.
-- ============================================================
alter table public.reviews enable row level security;
alter table public.posts enable row level security;

create policy "read active reviews" on public.reviews
  for select using (active = true);

create policy "read active posts" on public.posts
  for select using (active = true);

-- ============================================================
-- Bucket público "posts" para fotos/videos del taller (hasta 50 MB)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts',
  'posts',
  true,
  52428800, -- 50 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

create policy "public read posts" on storage.objects
  for select using (bucket_id = 'posts');

create policy "service write posts" on storage.objects
  for insert with check (bucket_id = 'posts');
