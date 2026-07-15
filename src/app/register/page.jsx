"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState(null);
  const [referralName, setReferralName] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (refCode) {
      setReferralCode(refCode);
      validateReferral(refCode);
    }
  }, [refCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  async function validateReferral(code) {
    if (!code) { setReferralValid(null); return; }
    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();
      setReferralValid(data.valid);
      setReferralName(data.referrerName || "");
    } catch {
      setReferralValid(false);
    }
  }

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre es requerido";
    if (!form.email.trim()) errors.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email inválido";
    if (!form.password) errors.password = "La contraseña es requerida";
    else if (form.password.length < 6) errors.password = "Mínimo 6 caracteres";
    if (!form.storeName.trim()) errors.storeName = "El nombre de la tienda es requerido";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const payload = { ...form, email: form.email.toLowerCase() };
      if (referralCode) payload.referralCode = referralCode.toUpperCase().trim();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
        } else {
          setError(data.error || "Error registrando usuario");
        }
        setLoading(false);
        return;
      }

      setSuccess(
        `Registro exitoso. Usuario "${data.name}" creado con la tienda "${data.stores[0].name}". Redirigiendo...`
      );
      setForm({ name: "", email: "", password: "", storeName: "" });

      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">
      {/* Background images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-5 gap-0 opacity-30">
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783892235/mi_tienda/a1a1f3oj3lfpzrmv1jsb.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783956527/mi_tienda/bkjzbxrpij42fyzthshf.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783896606/mi_tienda/q9vn1s5jfgdzbuyi3wbt.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783896868/mi_tienda/lnb86rx7hkqnonbfd7gz.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783895702/mi_tienda/rdeylpspuzuaczod8r4y.jpg" alt="" className="w-full h-full object-cover hidden md:block" />
        </div>
        {/* Slight top overlay for contrast */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-50/80 to-transparent" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Crear cuenta</h1>
          <p className="text-white/90 mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">Registra tu tienda y empieza a vender</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Tu nombre"
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 ${
                  fieldErrors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="tu@email.com"
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 ${
                  fieldErrors.email ? "border-red-400" : "border-gray-300"
                }`}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition pr-10 disabled:bg-gray-50 ${
                    fieldErrors.password ? "border-red-400" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="reg-store" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la tienda
              </label>
              <input
                id="reg-store"
                name="storeName"
                type="text"
                value={form.storeName}
                onChange={handleChange}
                autoComplete="organization"
                placeholder="Ej: Mi Tienda"
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 ${
                  fieldErrors.storeName ? "border-red-400" : "border-gray-300"
                }`}
              />
              {fieldErrors.storeName && <p className="text-red-500 text-xs mt-1">{fieldErrors.storeName}</p>}
            </div>

            {/* Código de referido */}
            <div>
              <label htmlFor="reg-ref" className="block text-sm font-medium text-gray-700 mb-1">
                Código de referido <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                id="reg-ref"
                type="text"
                value={referralCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().trim();
                  setReferralCode(val);
                  if (val.length >= 6) validateReferral(val);
                  else { setReferralValid(null); setReferralName(""); }
                }}
                placeholder="Ej: ABC12345"
                maxLength={8}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 uppercase tracking-wider font-mono"
              />
              {referralValid === true && (
                <p className="text-green-600 text-xs mt-1">✓ Código válido — te invita <strong>{referralName}</strong></p>
              )}
              {referralValid === false && referralCode.length >= 6 && (
                <p className="text-red-500 text-xs mt-1">Código no válido</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition shadow-lg shadow-gray-400 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Registrando...
                </span>
              ) : (
                "Registrarse"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-green-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
