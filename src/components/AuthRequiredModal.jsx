// src/components/AuthRequiredModal.jsx
"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthRequiredModal({ open, onClose, callbackUrl = "/" }) {
  const router = useRouter();
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && open && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      setTimeout(() => firstButtonRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const redirect = callbackUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

  return (
    <div className="auth-modal-backdrop" aria-modal="true" role="dialog" aria-labelledby="auth-modal-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal" ref={modalRef} role="document" aria-describedby="auth-modal-desc">
        <div className="auth-left">
          <div className="auth-left-overlay">
            <h2 className="welcome-title">Bienvenido</h2>
            <p className="welcome-sub">Ofertas exclusivas para nuevos compradores</p>
            <div className="big-offer">HASTA <span>70% OFF</span></div>
            <button ref={firstButtonRef} onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirect)}`)} className="btn-primary" aria-label="Registrarse">Regístrate</button>
            <p className="small-note">Al registrarte aceptas los Términos y la Política de privacidad.</p>
          </div>
        </div>

        <div className="auth-right">
          <h3 id="auth-modal-title" className="right-title">¿Ya tienes una cuenta?</h3>
          <p id="auth-modal-desc" className="right-sub">Inicia sesión para guardar tu carrito y acceder a ofertas</p>

          <div className="auth-actions">
            <button onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)} className="btn-outline" aria-label="Iniciar sesión">Iniciar sesión</button>

            <button onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirect)}`)} className="btn-secondary" aria-label="Crear cuenta">Crear cuenta</button>
          </div>

          <div className="quick-access">
            <p className="quick-label">Acceso rápido</p>
            <div className="quick-icons">
              <button onClick={() => signIn("google", { callbackUrl: redirect })} aria-label="Continuar con Google" className="icon-btn">
                {/* SVG Google */}
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.3-2H12v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-6.9z"/><path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2.1 1-3.3 1-2.5 0-4.6-1.7-5.3-4.1H3.4v2.6C5 19.9 8.3 22 12 22z"/><path fill="#FBBC05" d="M6.7 13.9A6.6 6.6 0 0 1 6.4 12c0-.6.1-1.2.3-1.8V7.6H3.4A10 10 0 0 0 2 12c0 1.6.4 3.1 1.4 4.4l3.3-2.5z"/><path fill="#EA4335" d="M12 6.5c1.4 0 2.6.5 3.6 1.5l2.7-2.7C16.8 3.6 14.6 2.5 12 2.5 8.3 2.5 5 4.6 3.4 7.6l3 2.6C7.4 7.9 9.5 6.5 12 6.5z"/></svg>
              </button>

              <button onClick={() => signIn("facebook", { callbackUrl: redirect })} aria-label="Continuar con Facebook" className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="#1877F2" d="M22 12.1C22 6.6 17.5 2 12 2S2 6.6 2 12.1c0 5 3.7 9.1 8.5 9.9v-7H8.1v-2.9h2.4V9.1c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .1 2 .1v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4v1.7h2.5l-.4 2.9h-2.1v7C18.3 21.2 22 17.1 22 12.1z"/></svg>
              </button>

              <button onClick={() => signIn("apple", { callbackUrl: redirect })} aria-label="Continuar con Apple" className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="#000" d="M16.8 7.1c-.1-1.2.5-2.1 1.6-2.7-1-.6-2.2-.7-3.3-.4-1 .3-1.8 1-2.3 1.9-.5.9-.8 2-1 3.1-.2 1.1-.1 2.3.4 3.3.5 1 1.4 1.8 2.5 2.1.4.1.8.2 1.2.2.1-1.1.5-2.1 1.1-3 .6-.9 1.4-1.6 2.3-2.1-.9-.6-1.6-1.6-1.9-2.6z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} aria-label="Cerrar modal" className="close-x">✕</button>
      </div>

      <style jsx>{`
        /* estilos idénticos a los tuyos (omito por brevedad) */
        /* ... */
      `}</style>
    </div>
  );
}
