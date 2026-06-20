// src/app/confirm-code/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmCodePage() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Validando código...");

    try {
      const res = await fetch("/api/auth/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Cuenta verificada correctamente. Ya puedes iniciar sesión.");
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error interno del servidor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Confirmar código</h2>

      <label className="block mb-2">
        Correo electrónico:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <label className="block mb-4">
        Código de verificación:
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full border px-3 py-2 rounded-md" required />
      </label>

      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
        Confirmar
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
