// components/navbar/UserMenu.jsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthProvider";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const isLoggedIn = !!user;

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await logout({ redirectTo: "/" });
    } catch (err) {
      console.error("UserMenu logout error:", err);
      window.location.replace("/");
    } finally {
      setSigningOut(false);
    }
  }, [logout]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 text-sm shrink-0">
        <div role="button" tabIndex={0} onClick={() => router.push("/login")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/login"); }} className="cursor-pointer flex items-center gap-1 hover:text-green-600 min-h-[44px] justify-center px-2 sm:px-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          <span className="text-xs hidden sm:inline">Iniciar sesión</span>
        </div>
        <div role="button" tabIndex={0} onClick={() => router.push("/register")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/register"); }} className="cursor-pointer bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 min-h-[40px] flex items-center whitespace-nowrap">
          <span className="text-xs">Registrarse</span>
        </div>
      </div>
    );
  }

  const name = user.name || user.email || "Usuario";
  const userPlan = user.plan || "free";

  return (
    <div className="flex items-center gap-1 sm:gap-2 text-sm shrink-0">
      {/* User name + plan badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-700 text-xs font-medium hidden sm:inline max-w-[100px] truncate">{name}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          userPlan === "full" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}>
          {userPlan === "full" ? "FULL" : "FREE"}
        </span>
      </div>

      {/* Dashboard icon - tooltip on hover */}
      <div className="relative group">
        <div role="button" tabIndex={0} onClick={() => router.push("/dashboard")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard"); }} className="cursor-pointer hover:text-green-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </div>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Dashboard</span>
      </div>

      {/* Logout icon - tooltip on hover */}
      <div className="relative group">
        <button onClick={handleSignOut} className="text-red-500 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center" disabled={signingOut} aria-busy={signingOut}>
          {signingOut ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          )}
        </button>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Salir</span>
      </div>
    </div>
  );
}
