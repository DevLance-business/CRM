"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "14px",
              border: "1px solid var(--color-glass-border)",
              background: "var(--color-surface)",
              backdropFilter: "blur(16px)",
              color: "var(--color-foreground)",
              fontFamily: "var(--font-sans)",
              boxShadow: "0 20px 40px -12px rgba(37,99,235,0.16)",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}