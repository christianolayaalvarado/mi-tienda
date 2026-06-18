"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function SessionInfo() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  if (status === "loading") {
    return <span className="text-sm text-gray-500">Cargando...</span>;
  }

  if (!session?.user) {
    return (
      <a href="/login" className="px-3 py-1 bg-green-600 text-white rounded text-sm">
        Entrar
      </a>
    );
  }

  const name = session.user.name ?? session.user.email ?? "Usuario";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <img
          src={session.user.image ?? "/avatar-placeholder.png"}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="hidden md:inline text-sm">{name}</span>
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
        >
          <div className="px-3 py-2 text-sm text-gray-700">Hola, <strong>{name}</strong></div>
          <a href="/dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">Dashboard</a>
          <a href="/orders" className="block px-3 py-2 text-sm hover:bg-gray-50">Mis pedidos</a>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
