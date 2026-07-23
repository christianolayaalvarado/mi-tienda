// components/navbar/UserMenu.jsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAuthContext } from "@/context/AuthProvider";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuthContext();
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const displayUser = useMemo(() => {
    if (user) return user;
    if (nextAuthSession?.user?.email || nextAuthSession?.user?.id) {
      return nextAuthSession.user;
    }
    return null;
  }, [user, nextAuthSession]);

  const isLoggedIn = !!displayUser;
  const isLoading = authLoading || nextAuthStatus === "loading";

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

  if (isLoading) {
    return <span className="text-sm text-gray-500">...</span>;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1 sm:gap-3 text-sm shrink-0">
        <div role="button" tabIndex={0} onClick={() => router.push("/login")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/login"); }} className="cursor-pointer flex items-center gap-1 hover:text-green-600 min-h-[44px] justify-center px-1">
          <User size={18} />
          <span className="hidden sm:inline">Login</span>
        </div>
        <div role="button" tabIndex={0} onClick={() => router.push("/register")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/register"); }} className="cursor-pointer bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 min-h-[40px] flex items-center whitespace-nowrap">
          <span className="sm:hidden text-xs">Registrate</span>
          <span className="hidden sm:inline">Registrarse</span>
        </div>
      </div>
    );
  }

  const name = displayUser.name || displayUser.email || "Usuario";
  const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
  const userPlan = displayUser.plan || "free";

  return (
    <div className="flex items-center gap-1 sm:gap-3 text-sm shrink-0">
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-gray-600 text-xs hidden sm:inline">{name}</span>
        <span className="text-gray-600 text-xs sm:hidden">{shortName}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          userPlan === "full" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}>
          {userPlan === "full" ? "FULL" : "FREE"}
        </span>
        <div role="button" tabIndex={0} onClick={() => router.push("/dashboard")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard"); }} className="cursor-pointer hover:text-green-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span className="hidden sm:inline ml-1">Dashboard</span>
        </div>
        <div role="button" tabIndex={0} onClick={() => router.push("/dashboard/chat")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard/chat"); }} className="cursor-pointer hover:text-green-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline ml-1">Chat</span>
        </div>
      </div>

      <button onClick={handleSignOut} className="text-red-500 hover:underline min-w-[44px] min-h-[44px] flex items-center justify-center" disabled={signingOut} aria-busy={signingOut}>
        {signingOut ? "..." : <span className="hidden sm:inline">Salir</span>}
        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
      </button>
    </div>
  );
}
