"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import WelcomeBenefits from "@/components/WelcomeBenefits";

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

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [referralCode, setReferralCode] = useState(refCode);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre es requerido";
    if (!form.email.trim()) errors.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalido";
    if (!form.password) errors.password = "La contrasena es requerida";
    else if (form.password.length < 6) errors.password = "Minimo 6 caracteres";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const payload = { email: form.email.toLowerCase(), password: form.password, name: form.name };
      if (referralCode) payload.referralCode = referralCode.toUpperCase().trim();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Error registrando usuario");
        setLoading(false);
        return;
      }

      setRegisteredName(form.name || "");
      setShowWelcome(true);
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    router.push(`/auth/confirm-code?email=${encodeURIComponent(form.email)}`);
  };

  const handleWelcomeUpgrade = () => {
    setShowWelcome(false);
    router.push("/upgrade?from=register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-5 gap-0 opacity-30">
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783892235/mi_tienda/a1a1f3oj3lfpzrmv1jsb.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783956527/mi_tienda/bkjzbxrpij42fyzthshf.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783896606/mi_tienda/q9vn1s5jfgdzbuyi3wbt.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783896868/mi_tienda/lnb86rx7hkqnonbfd7gz.jpg" alt="" className="w-full h-full object-cover" />
          <img src="https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783895702/mi_tienda/rdeylpspuzuaczod8r4y.jpg" alt="" className="w-full h-full object-cover hidden md:block" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-50/80 to-transparent" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">Crear cuenta</h1>
          <p className="text-white/90 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">Registrate gratis y empieza a comprar</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Tu nombre"
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 ${fieldErrors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="tu@email.com"
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Minimo 6 caracteres"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition pr-10 disabled:bg-gray-50 ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de referido <span className="text-gray-400">(opcional)</span></label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().trim())}
                placeholder="Ej: ABC12345"
                maxLength={8}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 uppercase tracking-wider font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition shadow-lg shadow-gray-400 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Registrando...
                </span>
              ) : (
                "Registrarse gratis"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-green-600 font-medium hover:underline">Inicia sesion</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Gratis para comprar. <Link href="/upgrade" className="text-green-600 hover:underline">Quieres vender? Conoce Full</Link>
        </p>
      </div>

      <WelcomeBenefits isOpen={showWelcome} onClose={handleWelcomeClose} onUpgrade={handleWelcomeUpgrade} userName={registeredName} />
    </div>
  );
}
