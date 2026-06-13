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
    // Si aún no tenemos snapshot, no permitimos enviar
    if (!initial) return false;
    if (form.name !== initial.name) return true;
    if (form.city !== initial.city) return true;
    // contraseña: solo cuenta como cambio si el usuario escribió algo
    if (form.password && form.password.length > 0) return true;
    return false;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!hasChanges()) {
    toast("No hay cambios para guardar");
    return;
  }
  if (form.password && form.password !== form.confirmPassword) {
    toast.error("Las contraseñas no coinciden");
    return;
  }

  setLoading(true);
  try {
    const payload = {};
    if (initial?.name !== form.name) payload.name = form.name;
    if (initial?.city !== form.city) payload.city = form.city;
    if (form.password) payload.password = form.password;

    if (Object.keys(payload).length === 0) {
      toast("No hay cambios para guardar");
      return;
    }

    console.log("handleSubmit payload:", payload);

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await res.json().catch((err) => {
        console.error("JSON parse error:", err);
        return null;
      });
    } else {
      const text = await res.text().catch(() => null);
      data = { message: text || `Respuesta ${res.status}` };
    }

    if (res.status === 401) {
      toast.error("No autorizado. Inicia sesión.");
      return;
    }
    if (!res.ok) {
      const message = data?.error || data?.message || `Error ${res.status}`;
      toast.error(message);
      return;
    }

    toast.success(data?.message || "Perfil actualizado");
    const newInitial = {
      name: data?.name ?? initial?.name ?? form.name,
      email: data?.email ?? initial?.email ?? form.email,
      city: data?.city ?? initial?.city ?? form.city,
    };
    if (mountedRef.current) {
      setInitial(newInitial);
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    }
  } catch (err) {
    console.error("handleSubmit error:", err);
    toast.error("Error inesperado al guardar");
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
          name="name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block text-sm">Email (no editable)</label>
        <input
          name="email"
          value={form.email}
          readOnly
          className="w-full border p-2 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm">Nueva contraseña</label>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          placeholder="Dejar en blanco para mantener la contraseña actual"
          aria-describedby="password-help"
          className="w-full border p-2"
        />
        <p id="password-help" className="text-xs text-gray-500 mt-1">
          Deja en blanco para mantener la contraseña actual.
        </p>
      </div>

      <div>
        <label className="block text-sm">Confirmar contraseña</label>
        <input
          type="password"
          name="confirmNewPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          placeholder="Solo si cambias la contraseña"
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block text-sm">Ciudad</label>
        <input
          name="city"
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
