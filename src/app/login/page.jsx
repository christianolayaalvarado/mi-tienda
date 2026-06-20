// src/app/login/page.jsx
import React from "react";
import LoginClientLoader from "@/components/LoginClientLoader";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <LoginClientLoader />
    </main>
  );
}
