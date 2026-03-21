"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function DashboardLayout({ children }) {

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    }
  }, [session, status])

  if (!session) return null

  return (
    <div className="min-h-screen flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">

        <h2 className="text-xl font-bold mb-8">
          Dashboard
        </h2>

        <nav className="flex flex-col gap-4">

          <Link href="/dashboard">
            Inicio
          </Link>

          <Link href="/dashboard/products">
            Productos
          </Link>

        </nav>

      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6 bg-gray-50">
        {children}
      </main>

    </div>
  )
}