// src/app/(shop)/auth/confirm-code/ConfirmCodeClient.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfirmCodeClient({ email: initialEmail = "", initialCode = "" }) {
  const router = useRouter();

  const [email] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("No se encontró el email.");
      return;
    }
    if (!code || code.trim().length === 0) {
      setError("Ingresa el código de verificación.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Error verificando el código.");
        setLoading(false);
        return;
      }

      setMessage(data?.message || "Cuenta verificada correctamente.");
      setLoading(false);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("confirm-code error:", err);
      setError("Error de red. Intenta de nuevo.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    if (!email) {
      setError("No se encontró el email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || "No se pudo reenviar el código.");
      } else {
        setMessage(data?.message || "Código reenviado correctamente.");
      }
    } catch (err) {
      console.error("send-code error:", err);
      setError("Error de red al reenviar el código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 12 }}>
      <p>
        Verificando cuenta para: <strong>{email || "—"}</strong>
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label style={{ display: "block" }}>
          Código de verificación
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ingresa el código"
            style={{ width: "100%", padding: "8px", marginTop: 6 }}
            disabled={loading}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Verificando..." : "Confirmar"}
          </button>

          <button type="button" onClick={handleResend} disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Enviando..." : "Reenviar código"}
          </button>
        </div>
      </form>

      {message && <div style={{ marginTop: 12, color: "green" }}><strong>{message}</strong></div>}
      {error && <div style={{ marginTop: 12, color: "crimson" }}><strong>{error}</strong></div>}
    </section>
  );
}
