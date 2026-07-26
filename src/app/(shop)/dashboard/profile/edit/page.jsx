"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ThemeSelector from "@/components/ThemeSelector";

const SECTIONS_BASE = [
  { id: "personal", label: "Datos personales", icon: "👤" },
  { id: "address", label: "Dirección", icon: "📍" },
  { id: "security", label: "Seguridad", icon: "🔒" },
  { id: "appearance", label: "Apariencia", icon: "🎨", adminOnly: true },
];

export default function EditProfilePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const initializedRef = useRef(false);
  const [userRole, setUserRole] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          password: "",
          confirmPassword: "",
          city: data.city ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
        });
        setUserRole(data.role ?? null);
      } catch {}
    })();
  }, []);

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
        city: form.city,
        address: form.address,
        phone: form.phone,
      };
      if (form.password) payload.password = form.password;

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
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        return;
      }
      if (!res.ok) {
        toast.error(data?.error || data?.message || `Error ${res.status}`);
        return;
      }

      toast.success(data?.message || "Perfil actualizado");
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole === "admin" || userRole === "ADMIN";
  const sections = SECTIONS_BASE.filter((s) => !s.adminOnly || isAdmin);

  useEffect(() => {
    if (activeTab === "appearance" && !isAdmin) {
      setActiveTab("personal");
    }
  }, [activeTab, isAdmin]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition shrink-0 ${
                  activeTab === s.id
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6">
          {activeTab === "personal" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Datos personales</h3>
                <p className="text-sm text-gray-500">Tu información básica de contacto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Ej: 51 999 123 456"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
                <p className="text-xs text-gray-400 mt-1">Incluye código de país (51 para Perú). Ej: 51999123456</p>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dirección de envío</h3>
                <p className="text-sm text-gray-500">Se usará como dirección predeterminada en tus pedidos</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Ej: Trujillo"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección completa</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Calle, número, urbanización, distrito"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
                <p className="text-xs text-gray-400 mt-1">Incluye referencias para facilitar la entrega</p>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cambiar contraseña</h3>
                <p className="text-sm text-gray-500">Deja en blanco si no deseas cambiarla</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition pr-10"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Apariencia</h3>
                <p className="text-sm text-gray-500">Personaliza los colores de la tienda</p>
              </div>
              <ThemeSelector />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
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
    </div>
  );
}
