// app/(shop)/dashboard/profile/edit/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
  });

  useEffect(() => {
    if (!session?.user) return;
    setForm((f) => ({
      ...f,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      city: session.user.city ?? session.user.storeLocation ?? "",
    }));
  }, [session]);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        ...(form.password ? { password: form.password } : {}),
        city: form.city,
      };
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Error actualizando perfil");
        setLoading(false);
        return;
      }
      toast.success("Perfil actualizado");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold">Editar Perfil</h2>

      <div>
        <label className="block text-sm">Nombres</label>
        <input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block text-sm">Email (no editable)</label>
        <input
          value={form.email}
          readOnly
          className="w-full border p-2 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm">Nueva contraseña</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block text-sm">Confirmar contraseña</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block text-sm">Ciudad</label>
        <input
          value={form.city}
          onChange={(e) => handleChange("city", e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={() => router.push("/dashboard")} className="px-4 py-2 border rounded">
          Cancelar
        </button>
      </div>
    </form>
  );
}
