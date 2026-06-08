// components/navbar/UserMenu.jsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { signOut } from "next-auth/react";

export default function UserMenu({ session }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } finally {
      setSigningOut(false);
    }
  }, []);

  if (!session) {
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

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs">{session.user?.name || "Usuario"}</span>
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
