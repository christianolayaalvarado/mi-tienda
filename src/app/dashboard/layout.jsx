import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }) {

  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

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