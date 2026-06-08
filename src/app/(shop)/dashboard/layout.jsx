import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    // Wrapper ocupa toda la ventana; el scroll se delega al main
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4 hidden md:flex flex-col justify-between sticky top-0 h-screen">
        <div>
          <h2 className="text-xl font-bold mb-6">Dashboard</h2>

          <p className="text-sm mb-4 text-gray-300 break-all">
            {session.user.email}
          </p>

          <nav className="flex flex-col gap-2">
            <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-gray-700 transition">🏠 Inicio</Link>
            <Link href="/dashboard/products" className="px-3 py-2 rounded hover:bg-gray-700 transition">📦 Productos</Link>
            <Link href="/dashboard/orders" className="px-3 py-2 rounded hover:bg-gray-700 transition">🧾 Mis Órdenes</Link>
            <Link href="/dashboard/seller/orders" className="px-3 py-2 rounded hover:bg-gray-700 transition">💰 Ventas</Link>

            <div className="mt-auto pt-4 border-t border-gray-700">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </aside>

      {/* Contenido: este es el único contenedor con scroll (overflow-auto) */}
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
