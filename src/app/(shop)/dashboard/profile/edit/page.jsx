// app/(shop)/dashboard/profile/edit/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(null); // snapshot de los datos iniciales
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const initialData = {
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      city: session.user.city ?? "",
    };
    setInitial(initialData);
    setForm((f) => ({
      ...f,
      name: initialData.name,
      email: initialData.email,
      city: initialData.city,
    }));
  }, [session]);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Comprueba si hay cambios respecto al snapshot inicial (ignora campos de contraseña vacíos)
  const hasChanges = () => {
    if (!initial) return true;
    if (form.name !== initial.name) return true;
    if (form.city !== initial.city) return true;
    // contraseña: solo cuenta como cambio si el usuario escribió algo
    if (form.password && form.password.length > 0) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si no hay cambios, no hacemos petición
    if (!hasChanges()) {
      toast("No hay cambios para guardar");
      return;
    }

    // Si el usuario escribió contraseña, validar confirmación
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      // Construir payload solo con campos modificados
      const payload = {};
      if (initial?.name !== form.name) payload.name = form.name;
      if (initial?.city !== form.city) payload.city = form.city;
      // Incluir password solo si el usuario escribió una nueva
      if (form.password && form.password.length > 0) payload.password = form.password;

      // Si por alguna razón payload queda vacío (defensa), no llamar
      if (Object.keys(payload).length === 0) {
        toast("No hay cambios para guardar");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast.error("No autorizado. Inicia sesión.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Error actualizando perfil");
        setLoading(false);
        return;
      }

      toast.success("Perfil actualizado");
      // Actualizar snapshot inicial con los cambios aplicados
      const updated = await res.json().catch(() => null);
      const newInitial = {
        name: updated?.name ?? initial?.name ?? form.name,
        email: updated?.email ?? initial?.email ?? form.email,
        city: updated?.city ?? initial?.city ?? form.city,
      };
      if (mountedRef.current) {
        setInitial(newInitial);
        setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      }
      // opcional: redirigir o refrescar sesión si es necesario
      // router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado");
    } finally {
      if (mountedRef.current) setLoading(false);
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
          placeholder="Dejar en blanco para mantener la contraseña actual"
          aria-describedby="password-help"
        />
        <p id="password-help" className="text-xs text-gray-500 mt-1">
          Deja en blanco para mantener la contraseña actual.
        </p>
      </div>

      <div>
        <label className="block text-sm">Confirmar contraseña</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          className="w-full border p-2"
          placeholder="Solo si cambias la contraseña"
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
