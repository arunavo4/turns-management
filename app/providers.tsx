"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduced cache times to prevent memory buildup
            staleTime: 1 * 60 * 1000, // 1 minute - data remains fresh
            gcTime: 2 * 60 * 1000, // 2 minutes - garbage collect unused queries
            retry: 2, // Retry failed requests twice
            refetchOnWindowFocus: false, // Don't refetch on tab focus
            refetchOnMount: true, // Refetch if stale when component mounts
            refetchOnReconnect: true, // Refetch when reconnecting
          },
          mutations: {
            retry: 1, // Retry mutations once on failure
            onError: (error) => {
              console.error('Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}