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
      <div className="flex items-center gap-3 text-sm">
        <div role="button" tabIndex={0} onClick={() => router.push("/login")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/login"); }} className="cursor-pointer flex items-center gap-1 hover:text-green-600">
          <User size={18} />
          <span>Login</span>
        </div>
        <div role="button" tabIndex={0} onClick={() => router.push("/register")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/register"); }} className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
          Registrarse
        </div>
      </div>
    );
  }

  const name = displayUser.name || displayUser.email || "Usuario";

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs">{name}</span>
        <div role="button" tabIndex={0} onClick={() => router.push("/dashboard")} onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard"); }} className="cursor-pointer hover:text-green-600">
          Dashboard
        </div>
      </div>

      <button onClick={handleSignOut} className="text-red-500 hover:underline" disabled={signingOut} aria-busy={signingOut}>
        {signingOut ? "Saliendo..." : "Salir"}
      </button>
    </div>
  );
}
