// app/(shop)/dashboard/layout.jsx
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/serverAuth";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user?.name ?? null;
  const userEmail = user?.email ?? null;

  return (
    <DashboardShell userName={userName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
