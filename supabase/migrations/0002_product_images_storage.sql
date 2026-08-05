-- ============================================================
-- Migración 0002: bucket público para imágenes de productos
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- (después de ejecutar 0001)
-- ============================================================

-- Crea el bucket público "product-images" (lectura anónima; la subida se hace
-- por el servidor con service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Política: cualquier persona puede leer objetos del bucket público.
create policy "public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Política: solo el servidor (service role) puede escribir. No se abre la
-- escritura al anónimo; las subidas van por el Server Endpoint.
create policy "service write product-images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');