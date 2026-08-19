-- ============================================================
-- Migración 0006: controles de sección
--   * text_align        -> alineación del contenido (left/center/right)
--   * decoration_left   -> imagen decorativa al lado izquierdo
--   * decoration_right  -> imagen decorativa al lado derecho
--   * Nuevas secciones editables: 'faq' y 'footer'
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- (después de 0005)
-- ============================================================

-- Amplía las claves permitidas de sección (añade faq y footer).
alter table public.sections drop constraint if exists sections_key_check;
alter table public.sections add constraint sections_key_check check (
  key in ('hero','welcome','videos','products','about','testimonials','instagram','contact','faq','footer')
);

-- Columnas nuevas de control.
alter table public.sections add column if not exists text_align text;
alter table public.sections add column if not exists decoration_left text;
alter table public.sections add column if not exists decoration_right text;

alter table public.sections drop constraint if exists sections_align_check;
alter table public.sections add constraint sections_align_check check (
  text_align is null or text_align in ('left','center','right')
);

-- Alineación por defecto según el diseño original de cada sección.
update public.sections set text_align = 'left'
  where key in ('hero','videos','products','about','instagram') and text_align is null;
update public.sections set text_align = 'center'
  where key in ('welcome','testimonials','contact') and text_align is null;

-- Secciones nuevas (FAQ y pie de página).
insert into public.sections (key, active, text_align) values
  ('faq',    true, 'center'),
  ('footer', true, 'center')
on conflict (key) do nothing;