"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams?.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pre = searchParams?.get("email");
    if (pre) setEmail(pre);
  }, [searchParams]);

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
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      // signIn returns an object like { error, status, ok, url }
      if (res?.error) {
        toast.error(res.error || "Credenciales inválidas");
      } else if (res?.ok) {
        toast.success("Sesión iniciada");
        // usar router.push para navegación cliente (mejor para SPA)
        router.push(redirect);
      } else {
        // fallback genérico
        toast.error("No se pudo iniciar sesión. Intenta de nuevo.");
      }
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
