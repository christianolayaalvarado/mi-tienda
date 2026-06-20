"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", storeName: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Registrando usuario...");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Validación segura: si stores existe, mostrar nombre
        const storeName = data.stores?.[0]?.name ? ` con la tienda "${data.stores[0].name}"` : "";
        setMessage(`✅ Usuario "${data.name}" creado${storeName}. Redirigiendo a confirmación...`);

        // Redirigir a la página de confirmación con el email
        router.push(`/confirm-code?email=${encodeURIComponent(form.email)}`);
      } else {
        setMessage(`❌ Error: ${data.error || data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error interno del servidor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Registro de Seller</h2>

      <label className="block mb-2">
        Nombre:
        <input name="name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <label className="block mb-2">
        Email:
        <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <label className="block mb-2">
        Contraseña:
        <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <label className="block mb-4">
        Nombre de la Tienda:
        <input name="storeName" value={form.storeName} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
        Registrarse
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
