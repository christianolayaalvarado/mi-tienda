// components/AuthRequiredModal.jsx
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
    <div
      className="auth-modal-backdrop"
      aria-modal="true"
      role="dialog"
      aria-labelledby="auth-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-modal"
        ref={modalRef}
        role="document"
      >
        <div className="auth-left">
          <div className="auth-left-overlay">
            <h2 className="welcome-title">Bienvenido</h2>
            <p className="welcome-sub">Ofertas exclusivas para nuevos compradores</p>
            <div className="big-offer">HASTA <span>70% OFF</span></div>
            <button
              ref={firstButtonRef}
              onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirect)}`)}
              className="btn-primary"
              aria-label="Registrarse"
            >
              Regístrate
            </button>
            <p className="small-note">Al registrarte aceptas los Términos y la Política de privacidad.</p>
          </div>
        </div>

        <div className="auth-right">
          <h3 id="auth-modal-title" className="right-title">¿Ya tienes una cuenta?</h3>
          <p className="right-sub">Inicia sesión para guardar tu carrito y acceder a ofertas</p>

          <div className="auth-actions">
            <button
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)}
              className="btn-outline"
              aria-label="Iniciar sesión"
            >
              Iniciar sesión
            </button>

            <button
              onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirect)}`)}
              className="btn-secondary"
              aria-label="Crear cuenta"
            >
              Crear cuenta
            </button>
          </div>

          <div className="quick-access">
            <p className="quick-label">Acceso rápido</p>
            <div className="quick-icons">
              <button onClick={() => signIn("google", { callbackUrl: redirect })} aria-label="Continuar con Google" className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.3-2H12v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-6.9z"/><path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2.1 1-3.3 1-2.5 0-4.6-1.7-5.3-4.1H3.4v2.6C5 19.9 8.3 22 12 22z"/><path fill="#FBBC05" d="M6.7 13.9A6.6 6.6 0 0 1 6.4 12c0-.6.1-1.2.3-1.8V7.6H3.4A10 10 0 0 0 2 12c0 1.6.4 3.1 1.4 4.4l3.3-2.5z"/><path fill="#EA4335" d="M12 6.5c1.4 0 2.6.5 3.6 1.5l2.7-2.7C16.8 3.6 14.6 2.5 12 2.5 8.3 2.5 5 4.6 3.4 7.6l3 2.6C7.4 7.9 9.5 6.5 12 6.5z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} aria-label="Cerrar modal" className="close-x">✕</button>
      </div>

      <style jsx>{`
        .auth-modal-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.65);
          z-index: 2000;
          padding: 20px;
        }
        .auth-modal {
          width: 910px;
          height: 460px;
          background: #fff;
          border-radius: 12px;
          display: flex;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }
        .auth-left {
          width: 48%;
          background-image: url('/images/welcome-hero.jpg');
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .auth-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45));
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 28px;
        }
        .welcome-title { font-size: 28px; font-weight: 800; margin: 0; }
        .welcome-sub { margin-top: 8px; font-size: 14px; opacity: 0.95; }
        .big-offer { margin-top: 18px; font-size: 34px; font-weight: 900; color: #ff4d4f; }
        .big-offer span { color: #fff; background: #ff4d4f; padding: 2px 6px; border-radius: 4px; margin-left: 8px; color: #fff; }
        .btn-primary {
          margin-top: 18px;
          background: #10b981;
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 700;
        }
        .small-note { margin-top: 10px; font-size: 11px; opacity: 0.9; color: rgba(255,255,255,0.9); }

        .auth-right {
          width: 52%;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .right-title { font-size: 20px; margin: 0; font-weight: 700; }
        .right-sub { margin-top: 6px; color: #6b7280; font-size: 13px; }

        .auth-actions { display: flex; gap: 12px; margin-top: 18px; }
        .btn-outline {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-secondary {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          background: #0b74de;
          color: #fff;
          cursor: pointer;
          font-weight: 700;
        }

        .quick-access { margin-top: 18px; }
        .quick-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
        .quick-icons { display: flex; gap: 10px; }
        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          cursor: pointer;
        }

        .close-x {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #374151;
        }

        @media (max-width: 980px) {
          .auth-modal { width: 92%; height: auto; flex-direction: column; }
          .auth-left, .auth-right { width: 100%; }
          .auth-left { height: 220px; }
        }
      `}</style>
    </div>
  );
}
