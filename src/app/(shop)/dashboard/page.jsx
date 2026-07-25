import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import DashboardCards from "@/components/DashboardCards";
import DashboardAnalytics from "@/components/DashboardAnalytics";

export default async function DashboardHome() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  let userPlan = "free";
  let userRole = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, role: true },
    });
    userPlan = dbUser?.plan || "free";
    userRole = dbUser?.role || null;
  } catch {}

  const isAdmin = userRole === "admin" || userRole === "ADMIN";
  const isFull = userPlan === "full" || isAdmin;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Hola, {user.name || "Usuario"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona una sección para comenzar
        </p>
      </div>

      {/* Analytics */}
      <DashboardAnalytics />

      {/* Category Cards */}
      <div className="mt-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Secciones
        </h2>
        <DashboardCards userRole={userRole} isFull={isFull} />
      </div>
    </div>
  );
}
