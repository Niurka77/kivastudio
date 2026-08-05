-- ============================================================
-- Migración 0001: tabla de productos + RLS
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- ============================================================

-- Habilita la extensión uuid-ossp para generar ids si no está activa
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  currency    text not null default 'PEN' check (currency = 'PEN'),
  availability text not null default 'in_stock'
               check (availability in ('in_stock', 'made_to_order')),
  lead_time   int check (lead_time is null or lead_time > 0),
  category_id text,
  image_url   text,
  gallery     jsonb not null default '[]'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índices para consultas frecuentes del catálogo
create index if not exists products_active_idx on public.products (active);
create index if not exists products_category_idx on public.products (category_id);

-- Trigger para mantener updated_at actualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: el cliente público (anon) SOLO lee productos activos.
-- Las escrituras van por el service role (servidor), que salta RLS.
-- ============================================================
alter table public.products enable row level security;

create policy "read active products" on public.products
  for select using (active = true);