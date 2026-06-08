"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={() => { setLoading(true); signOut({ callbackUrl: "/login" }); }}
      className={`mt-6 w-full py-2 rounded text-white ${loading ? "bg-red-300" : "bg-red-500 hover:bg-red-600"}`}
      disabled={loading}
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
