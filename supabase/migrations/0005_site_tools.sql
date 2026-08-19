-- ============================================================
-- Migración 0005: herramientas de contenido para las hermanas
--   * sections   -> títulos + fondos/texturas editables por sección
--   * videos     -> "Videos de las creaciones" (sección propia)
--   * admin_roles-> rol por correo (dueña, tendencias, videos, productos)
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- (después de 0004)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- SECCIONES: configuración visual de cada sección de la portada
-- ============================================================
create table if not exists public.sections (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique
                 check (key in ('hero','welcome','videos','products','about','testimonials','instagram','contact')),
  title          text,
  subtitle       text,
  background_url text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists sections_key_idx on public.sections (key);

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
  before update on public.sections
  for each row execute function public.set_updated_at();

alter table public.sections enable row level security;

-- El público lee SOLO las secciones activas. El admin (service role) lee todas.
create policy "read active sections" on public.sections
  for select using (active = true);

-- Secciones por defecto (títulos/fondos nulos => la web usa sus valores base)
insert into public.sections (key, active) values
  ('hero', true),
  ('welcome', true),
  ('videos', true),
  ('products', true),
  ('about', true),
  ('testimonials', true),
  ('instagram', true),
  ('contact', true)
on conflict (key) do nothing;

-- ============================================================
-- VIDEOS DE LAS CREACIONES
-- ============================================================
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  video_url     text not null,
  thumbnail_url text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists videos_active_idx on public.videos (active);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;

create policy "read active videos" on public.videos
  for select using (active = true);

-- Bucket público "videos" para los videos de las creaciones (hasta 200 MB).
-- También admite imágenes de portada (PNG/JPG/WEBP). La subida se hace por el
-- servidor con service role (nunca anónimo).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  209715200, -- 200 MB
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "public read videos" on storage.objects
  for select using (bucket_id = 'videos');

create policy "service write videos" on storage.objects
  for insert with check (bucket_id = 'videos');

-- ============================================================
-- ROLES ADMIN: rol por correo (la dueña = owner puede todo)
--   owner    -> todo
--   trends   -> novedades / día a día
--   videos   -> videos de las creaciones
--   products -> productos
-- ============================================================
create table if not exists public.admin_roles (
  email      text primary key,
  role       text not null
             check (role in ('owner','trends','videos','products')),
  name       text,
  updated_at timestamptz not null default now()
);

drop trigger if exists admin_roles_set_updated_at on public.admin_roles;
create trigger admin_roles_set_updated_at
  before update on public.admin_roles
  for each row execute function public.set_updated_at();

-- Sin políticas => SOLO el service role (servidor) lee/escribe. Los roles
-- se entregan al navegador vía el endpoint autenticado /api/admin/me.
alter table public.admin_roles enable row level security;

-- Roles por correo. Ajusta los correos/roles según el equipo:
insert into public.admin_roles (email, role, name) values
  ('kiliechisco@gmail.com', 'owner',   'Kaili'),
  ('daynakenya@gmail.com',  'trends',  'Dayna')
on conflict (email) do update set role = excluded.role, name = excluded.name;