"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ThemeSelector from "@/components/ThemeSelector";

export default function EditProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    address: "",
    phone: "",
  });

  // Placeholder state: true = showing placeholder, false = showing user value
  const [nameFocused, setNameFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const initialData = {
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      city: session.user.city ?? "",
      address: session.user.address ?? "",
      phone: session.user.phone ?? "",
    };
    setInitial(initialData);
    setForm((f) => ({
      ...f,
      name: initialData.name,
      email: initialData.email,
      city: initialData.city,
      address: initialData.address,
      phone: initialData.phone,
    }));
  }, [session]);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const hasChanges = () => {
    if (!initial) return false;
    if (form.name !== initial.name) return true;
    if (form.city !== initial.city) return true;
    if (form.address !== initial.address) return true;
    if (form.phone !== initial.phone) return true;
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
      if (initial?.address !== form.address) payload.address = form.address;
      if (initial?.phone !== form.phone) payload.phone = form.phone;
      if (form.password) payload.password = form.password;

      if (Object.keys(payload).length === 0) {
        toast("No hay cambios para guardar");
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let data = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => null);
        data = { message: text || `Respuesta ${res.status}` };
      }

      if (res.status === 401) {
        toast.error("No autorizado. Inicia sesión.");
        return;
      }
      if (!res.ok) {
        toast.error(data?.error || data?.message || `Error ${res.status}`);
        return;
      }

      toast.success(data?.message || "Perfil actualizado");
      const newInitial = {
        name: data?.name ?? initial?.name ?? form.name,
        email: data?.email ?? initial?.email ?? form.email,
        city: data?.city ?? initial?.city ?? form.city,
        address: data?.address ?? initial?.address ?? form.address,
        phone: data?.phone ?? initial?.phone ?? form.phone,
      };
      if (mountedRef.current) {
        setInitial(newInitial);
        setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      }

      // Actualizar la sesión de next-auth para reflejar cambios en el navbar
      if (updateSession) {
        updateSession({ user: { name: newInitial.name } });
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error("Error inesperado al guardar");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Get placeholder or value for name
  const getNameDisplay = () => {
    if (nameFocused) return form.name;
    if (form.name) return form.name;
    return "";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
          <p className="text-sm text-gray-500 mt-1">Actualiza tu información personal</p>
        </div>

        {/* Sección: Información personal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Información personal</h3>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={nameFocused ? form.name : (form.name || "")}
              onChange={(e) => handleChange("name", e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder={!form.name ? "Ingresa tu nombre" : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                nameFocused || form.name
                  ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  : "border-gray-300 text-gray-400"
              }`}
            />
          </div>

          {/* Email (no editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
              <span className="ml-2 text-xs text-gray-400 font-normal">(no editable)</span>
            </label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={phoneFocused ? form.phone : (form.phone || "")}
              onChange={(e) => handleChange("phone", e.target.value)}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              placeholder={!form.phone ? "Ej: 999 123 456" : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                phoneFocused || form.phone
                  ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  : "border-gray-300 text-gray-400"
              }`}
            />
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={cityFocused ? form.city : (form.city || "")}
              onChange={(e) => handleChange("city", e.target.value)}
              onFocus={() => setCityFocused(true)}
              onBlur={() => setCityFocused(false)}
              placeholder={!form.city ? "Ingresa tu ciudad" : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                cityFocused || form.city
                  ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  : "border-gray-300 text-gray-400"
              }`}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
              <span className="ml-2 text-xs text-gray-400 font-normal">(para envíos)</span>
            </label>
            <input
              type="text"
              value={addressFocused ? form.address : (form.address || "")}
              onChange={(e) => handleChange("address", e.target.value)}
              onFocus={() => setAddressFocused(true)}
              onBlur={() => setAddressFocused(false)}
              placeholder={!form.address ? "Calle, número, distrito" : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                addressFocused || form.address
                  ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  : "border-gray-300 text-gray-400"
              }`}
            />
            <p className="text-xs text-gray-400 mt-1">Se usará como dirección predeterminada en tus pedidos</p>
          </div>
        </div>

        {/* Sección: Tema de colores */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ThemeSelector />
        </div>

        {/* Sección: Seguridad */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cambiar contraseña</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Dejar en blanco para mantener la actual"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !hasChanges()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
