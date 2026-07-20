"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function ConfirmCodeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    const qEmail = searchParams?.get?.("email") || "";
    if (qEmail) setEmail(String(qEmail).toLowerCase().trim());
  }, [searchParams]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)?.getData("text")?.replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(newCode);
      const nextEmpty = newCode.findIndex((c) => !c);
      inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setMessage({ type: "", text: "" });

    const fullCode = code.join("").trim();
    if (!email) {
      setMessage({ type: "error", text: "No se encontró el email." });
      return;
    }
    if (fullCode.length !== 6) {
      setMessage({ type: "error", text: "Ingresa los 6 dígitos del código." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage({ type: "error", text: data?.message || "Código inválido. Intenta de nuevo." });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: "¡Cuenta verificada correctamente!" });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("confirm-code error:", err);
      setMessage({ type: "error", text: "Error de red. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setMessage({ type: "", text: "" });
    setResending(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage({ type: "error", text: data?.message || "No se pudo reenviar el código." });
      } else {
        setMessage({ type: "success", text: "Código reenviado. Revisa tu correo." });
        setCountdown(60);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de red al reenviar." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verificar tu correo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enviamos un código de 6 dígitos a
          </p>
          <p className="text-sm font-medium text-green-600 mt-1">{email || "tu correo"}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Code inputs */}
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50"
                />
              ))}
            </div>

            {/* Messages */}
            {message.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message.type === "success" ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                )}
                {message.text}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Verificando...
                </>
              ) : (
                "Confirmar código"
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-sm text-gray-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {countdown > 0
                ? `Reenviar código en ${countdown}s`
                : resending
                ? "Reenviando..."
                : "¿No recibiste el código? Reenviar"}
            </button>
          </div>

          {/* Back */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/register" className="text-green-600 font-medium hover:underline">
              ← Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
