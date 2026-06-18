// src/app/login/page.jsx
import React, { Suspense } from "react";
import LoginClient from "@/components/LoginClient";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

      {/* Suspense para el componente cliente que usa useSearchParams */}
      <Suspense fallback={<div className="text-gray-600">Cargando formulario...</div>}>
        <LoginClient />
      </Suspense>
    </main>
  );
}
