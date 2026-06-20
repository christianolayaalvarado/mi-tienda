"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Iniciando sesión...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        if (!data.user?.emailVerified) {
          setMessage("❌ Tu cuenta aún no está verificada. Revisa tu correo o solicita un nuevo código.");
          router.push(`/auth/confirm-code?email=${encodeURIComponent(form.email)}`);
        } else {
          setMessage("✅ Login exitoso. Redirigiendo al dashboard...");
          router.push("/dashboard"); // Ajusta según tu ruta real
        }
      } else {
        setMessage(`❌ Error: ${data.error || data.message || "Credenciales inválidas"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error interno del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Iniciar sesión</h2>

      <label className="block mb-2">
        Email:
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={loading}
        />
      </label>

      <label className="block mb-4">
        Contraseña:
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={loading}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
