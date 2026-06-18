// src/components/LoginClient.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react"; // si usas next-auth
import toast from "react-hot-toast";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ejemplo: si hay ?email=... en la URL, precargar
    const pre = searchParams?.get("email");
    if (pre) setEmail(pre);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ejemplo con next-auth credentials
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error || "Error iniciando sesión");
      } else {
        toast.success("Sesión iniciada");
        window.location.href = redirect;
      }
    } catch (err) {
      console.error(err);
      toast.error("Error en el login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
}
