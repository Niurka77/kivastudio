import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Proveedor de TanStack Query (SERVER STATE, ADR A.1).
 * Se instancia UNA vez en el cliente (módulo singleton) para compartir la
 * caché entre islas. TanStack Query nunca administra estado de UI.
 * Ver 02_PROJECT_ARCHITECTURE.md §8.8.
 */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min
        gcTime: 5 * 60 * 1000, // 5 min
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  const client = getQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
