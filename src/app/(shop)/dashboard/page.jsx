import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthUser } from "@/lib/serverAuth";
import DashboardWelcome from "@/components/DashboardWelcome";
import DashboardAnalytics from "@/components/DashboardAnalytics";

export default async function DashboardHome() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-theme-primary">Panel de control</h1>

      <p className="mb-6 text-theme-secondary text-sm sm:text-base">
        Bienvenido al panel de administración de tu tienda,{" "}
        {user.name}.
      </p>

      {/* Welcome section with tier and theme */}
      <DashboardWelcome />

      {/* Analytics */}
      <DashboardAnalytics />

      <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/dashboard/products"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Mis Productos
        </Link>

        <Link
          href="/dashboard/products/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          Nuevo Producto
        </Link>
      </div>
    </div>
  );
}