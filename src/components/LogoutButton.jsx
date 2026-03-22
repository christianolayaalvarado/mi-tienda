"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
    >
      Cerrar sesión
    </button>
  )
}