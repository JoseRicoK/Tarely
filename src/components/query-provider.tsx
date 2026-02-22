"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Mostrar datos cacheados inmediatamente, revalidar en background
            staleTime: 5 * 60_000, // 5min — datos considerados frescos
            gcTime: 30 * 60_000, // 30min — tiempo en memoria antes de limpiar
            refetchOnWindowFocus: true, // refetch al volver a la pestaña
            refetchOnReconnect: true, // refetch al recuperar conexión
            retry: 1, // reintentar 1 vez en error
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
