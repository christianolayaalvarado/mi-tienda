"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        if (!data.user?.emailVerified) {
          setMessage({ type: "warning", text: "Tu cuenta no está verificada. Redirigiendo..." });
          setTimeout(() => router.push(`/auth/confirm-code?email=${encodeURIComponent(form.email)}`), 1000);
        } else {
          setMessage({ type: "success", text: "Inicio de sesión exitoso. Redirigiendo..." });
          setTimeout(() => router.push("/dashboard"), 800);
        }
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Credenciales inválidas" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error de conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Lado izquierdo - Imagen/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Contenido del lado izquierdo */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl font-bold mb-4 text-center">Mi Tienda</h1>
          <p className="text-blue-100 text-lg text-center mb-12 max-w-md">
            Tu marketplace favorito. Compra y vende productos de calidad.
          </p>

          {/* Grid de imágenes de productos */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {/* Fila 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            {/* Fila 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            {/* Fila 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 aspect-square flex items-center justify-center transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">100+</p>
              <p className="text-blue-200 text-sm">Productos</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50+</p>
              <p className="text-blue-200 text-sm">Vendedores</p>
            </div>
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-blue-200 text-sm">Clientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 bg-gray-50 overflow-auto">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido de vuelta</h2>
            <p className="text-gray-500 mt-2">Ingresa para continuar comprando</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@email.com"
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Tu contraseña"
                    disabled={loading}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10 disabled:bg-gray-50"
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
                <div className="text-right mt-1">
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {message.text && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : message.type === "warning"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message.type === "success" ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  )}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Ingresando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            {/* Registro */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">¿No tienes cuenta?</p>
              <Link
                href="/register"
                className="w-full block py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Al continuar, aceptas nuestros{" "}
            <Link href="#" className="text-blue-600 hover:underline">Términos</Link>
            {" "}y{" "}
            <Link href="#" className="text-blue-600 hover:underline">Privacidad</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
