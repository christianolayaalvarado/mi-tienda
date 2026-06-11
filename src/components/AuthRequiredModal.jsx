// components/AuthRequiredModal.jsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthRequiredModal({ open, onClose, callbackUrl = "/" }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const redirect = callbackUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="modal" tabIndex={-1}>
        <div className="flex flex-col md:flex-row">
          {/* Left: oferta bienvenida */}
          <div className="w-full md:w-1/2 p-6 bg-gradient-to-b from-pink-50 to-white">
            <h3 className="text-2xl font-bold">Bienvenido</h3>
            <p className="mt-2 text-sm text-gray-700">Disfruta ofertas de bienvenida solo para nuevos compradores</p>
            <div className="mt-6 text-3xl font-extrabold text-red-500">HASTA 70% OFF</div>
            <button
              onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirect)}`)}
              className="mt-6 w-full py-2 bg-green-600 text-white rounded-lg"
              aria-label="Registrarse"
            >
              Regístrate
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Al registrarte aceptas los Términos y la Política de privacidad.
            </p>
          </div>

          {/* Right: acceso rápido */}
          <div className="w-full md:w-1/2 p-6">
            <h3 id="auth-title" className="text-lg font-semibold">¿Ya tienes una cuenta?</h3>
            <p className="text-sm text-gray-600 mt-1">Accede rápidamente con:</p>

            <div className="mt-4 grid gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl: redirect })}
                className="flex items-center gap-3 justify-center border py-2 rounded-lg"
                aria-label="Continuar con Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21.6 12.2c0-.7-.1-1.4-.3-2H12v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-6.9z" fill="#4285F4"/>
                  <path d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2.1 1-3.3 1-2.5 0-4.6-1.7-5.3-4.1H3.4v2.6C5 19.9 8.3 22 12 22z" fill="#34A853"/>
                  <path d="M6.7 13.9A6.6 6.6 0 0 1 6.4 12c0-.6.1-1.2.3-1.8V7.6H3.4A10 10 0 0 0 2 12c0 1.6.4 3.1 1.4 4.4l3.3-2.5z" fill="#FBBC05"/>
                  <path d="M12 6.5c1.4 0 2.6.5 3.6 1.5l2.7-2.7C16.8 3.6 14.6 2.5 12 2.5 8.3 2.5 5 4.6 3.4 7.6l3 2.6C7.4 7.9 9.5 6.5 12 6.5z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <button
                onClick={() => signIn("facebook", { callbackUrl: redirect })}
                className="flex items-center gap-3 justify-center border py-2 rounded-lg"
                aria-label="Continuar con Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 12.1C22 6.6 17.5 2 12 2S2 6.6 2 12.1c0 5 3.7 9.1 8.5 9.9v-7H8.1v-2.9h2.4V9.1c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .1 2 .1v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4v1.7h2.5l-.4 2.9h-2.1v7C18.3 21.2 22 17.1 22 12.1z" fill="#1877F2"/>
                </svg>
                Continuar con Facebook
              </button>

              <button
                onClick={() => signIn("apple", { callbackUrl: redirect })}
                className="flex items-center gap-3 justify-center border py-2 rounded-lg"
                aria-label="Continuar con Apple"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M16.8 7.1c-.1-1.2.5-2.1 1.6-2.7-1-.6-2.2-.7-3.3-.4-1 .3-1.8 1-2.3 1.9-.5.9-.8 2-1 3.1-.2 1.1-.1 2.3.4 3.3.5 1 1.4 1.8 2.5 2.1.4.1.8.2 1.2.2.1-1.1.5-2.1 1.1-3 .6-.9 1.4-1.6 2.3-2.1-.9-.6-1.6-1.6-1.9-2.6z" fill="#000"/>
                </svg>
                Continuar con Apple
              </button>

              <button
                onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)}
                className="mt-2 py-2 text-sm text-blue-600 underline"
                aria-label="Iniciar sesión con email"
              >
                ¿Prefieres iniciar sesión con usuario y contraseña?
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 text-gray-600"
        >
          ✕
        </button>

      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:1000; padding:16px; }
        .modal { position:relative; background:#fff; border-radius:10px; width:100%; max-width:820px; box-shadow:0 10px 30px rgba(0,0,0,0.2); overflow:hidden; }
      `}</style>
      </div>
    </div>
  );
}
