// app/(shop)/dashboard/layout.jsx
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch plan from database (JWT may not have it if user logged in before plan field was added)
  let userPlan = "free";
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, role: true },
    });
    userPlan = dbUser?.plan || "free";
  } catch {}

  const userName = user?.name ?? null;
  const userEmail = user?.email ?? null;
  const userRole = user?.role ?? null;

  return (
    <DashboardShell userName={userName} userEmail={userEmail} userRole={userRole} userPlan={userPlan}>
      {children}
    </DashboardShell>
  );
}
