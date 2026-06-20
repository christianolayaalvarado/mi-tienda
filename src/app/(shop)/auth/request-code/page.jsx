"use client";
import { useState } from "react";

export default function RequestCodePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async () => {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div>
      <h2>Verificación de cuenta</h2>
      <input
        type="email"
        placeholder="Tu correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleRequest}>Enviar código</button>
      <p>{message}</p>
    </div>
  );
}
