// src/components/LoginClient.jsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams?.get("redirect") || searchParams?.get("callbackUrl") || "/";
  const preEmail = searchParams?.get("email") || "";

  const [email, setEmail] = useState(preEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preEmail) setEmail(preEmail);
  }, [preEmail]);

  const validate = () => {
    if (!email || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Notificar y forzar refresh global del estado de auth
        toast.success("Sesión iniciada");
        // Emitir evento para que hooks/useAuth se refresque en otros componentes
        try {
          window.dispatchEvent(new Event("auth:refresh"));
        } catch (err) {
          // ignore si no está disponible (SSR edge cases)
        }
        // Pequeña espera para asegurar que la cookie esté establecida en el navegador
        setTimeout(() => {
          router.push(redirect);
        }, 150);
        return;
      }

      // Manejo de casos específicos
      if (res.status === 403) {
        // Cuenta no verificada
        toast.error(data.message || "Cuenta no verificada. Revisa tu correo.");
        // Redirigir a confirmación con email
        const confirmUrl = `/auth/confirm-code?email=${encodeURIComponent(email)}`;
        setTimeout(() => router.push(confirmUrl), 200);
        return;
      }

      // Credenciales inválidas u otros errores
      toast.error(data.message || "Credenciales inválidas");
    } catch (err) {
      console.error("login error:", err);
      toast.error("Error en el login. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 block w-full border rounded px-3 py-2"
          aria-required="true"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mt-1 block w-full border rounded px-3 py-2"
          aria-required="true"
          disabled={loading}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          aria-disabled={loading}
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
