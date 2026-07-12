import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthUser } from "@/lib/serverAuth";
import DashboardWelcome from "@/components/DashboardWelcome";

export default async function DashboardHome() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-theme-primary">Panel de control</h1>

      <p className="mb-6 text-theme-secondary">
        Bienvenido al panel de administración de tu tienda,{" "}
        {user.name}.
      </p>

      {/* Welcome section with tier and theme */}
      <DashboardWelcome />

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