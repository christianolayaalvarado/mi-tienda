"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}   // 🔥 clave
      refetchInterval={0}            // 🔥 evita polling
    >
      {children}
    </SessionProvider>
  );
}