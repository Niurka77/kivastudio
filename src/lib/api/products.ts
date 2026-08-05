import type { CreateProductInput, Product, UpdateProductInput } from '@/types';
import { getAccessToken } from '@/lib/auth/browser-auth';

/**
 * Acceso a la API de productos desde el cliente (islas React).
 * La capa de presentación usa TanStack Query sobre estos helpers (ADR A.1).
 * Las escrituras adjuntan el JWT de sesión (supabase.auth) para autorizar.
 * La ruta `/api/products` la sirve el servidor (server endpoint, 02 §7.13).
 */

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) {
    throw new Error('No se pudo cargar el catálogo');
  }
  return res.json() as Promise<Product[]>;
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (res.status === 404) {
    throw new Error('Producto no encontrado');
  }
  if (!res.ok) {
    throw new Error('No se pudo cargar el producto');
  }
  return res.json() as Promise<Product>;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  const token = await getAccessToken();
  const res = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para editar productos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo actualizar el producto');
  }
  return res.json() as Promise<Product>;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const token = await getAccessToken();
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para crear productos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo crear el producto');
  }
  return res.json() as Promise<Product>;
}

/** Sube una imagen al bucket público y devuelve su URL. */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = (await res.json().catch(() => null)) as {
    url?: string;
    message?: string;
  } | null;
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para subir imágenes');
  }
  if (!res.ok || !body?.url) {
    throw new Error(body?.message ?? 'No se pudo subir la imagen');
  }
  return { url: body.url };
}

/** Elimina un producto (solo admin). */
export async function deleteProduct(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error('Debes iniciar sesión como admin para eliminar productos');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message ?? 'No se pudo eliminar el producto');
  }
}
