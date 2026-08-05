-- ============================================================
-- Migración 0003: tabla de pedidos + RLS
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  items         jsonb not null default '[]'::jsonb,
  subtotal      numeric(10, 2) not null default 0 check (subtotal >= 0),
  currency      text not null default 'PEN' check (currency = 'PEN'),
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices para el panel (listado reciente y filtro por estado)
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Trigger para mantener updated_at actualizado
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: SIN políticas. Los pedidos solo los lee/escribe el service
-- role (servidor: /api/orders), que salta RLS. El cliente anónimo
-- NO tiene acceso directo a la tabla.
-- ============================================================
alter table public.orders enable row level security;
