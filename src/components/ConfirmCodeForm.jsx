// src/components/ConfirmCodeForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmCodeForm({ initialEmail = "" }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Validando código...");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage("✅ Cuenta verificada correctamente. Redirigiendo al login...");
        setTimeout(() => router.push("/login?email=" + encodeURIComponent(email)), 900);
      } else {
        setMessage(`❌ ${data.message || "Código inválido"}`);
      }
    } catch (err) {
      console.error("confirm-code error:", err);
      setMessage("❌ Error interno del servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("Ingresa tu email para reenviar el código.");
      return;
    }
    setResendLoading(true);
    setMessage("Reenviando código...");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage("✅ Código reenviado. Revisa tu correo.");
      } else {
        setMessage(`❌ ${data.message || "No se pudo reenviar el código"}`);
      }
    } catch (err) {
      console.error("send-code error:", err);
      setMessage("❌ Error enviando correo");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md" aria-live="polite">
      <h2 className="text-xl font-bold mb-4">Confirmar código</h2>

      <label className="block mb-2">
        Correo electrónico:
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          required
          aria-required="true"
          disabled={loading || resendLoading}
        />
      </label>

      <label className="block mb-4">
        Código de verificación:
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          required
          aria-required="true"
          disabled={loading || resendLoading}
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          aria-disabled={loading}
        >
          {loading ? "Validando..." : "Confirmar"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          aria-disabled={resendLoading}
        >
          {resendLoading ? "Reenviando..." : "Reenviar código"}
        </button>
      </div>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
