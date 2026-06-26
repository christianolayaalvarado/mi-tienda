// src/components/LogoutButton.jsx
"use client";

import { useState } from "react";
import { useAuthContext } from "@/context/AuthProvider";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout({ redirectTo: "/login" });
    } catch (err) {
      console.error("Logout error:", err);
      window.location.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`mt-6 w-full py-2 rounded text-white ${loading ? "bg-red-300" : "bg-red-500 hover:bg-red-600"}`}
      disabled={loading}
      aria-busy={loading}
      aria-disabled={loading}
      type="button"
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
