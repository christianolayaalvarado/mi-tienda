import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions"; // 🔥 IMPORTANTE
import Link from "next/link";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions); // 🔥 FIX

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de control</h1>

      <p>
        Bienvenido al panel de administración de tu tienda,{" "}
        {session.user.name}.
      </p>

      <div className="mt-6 flex gap-4">
        <Link
          href="/dashboard/products"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Mis Productos
        </Link>

        <Link
          href="/dashboard/products/new"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Nuevo Producto
        </Link>
      </div>
    </div>
  );
}