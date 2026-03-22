import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function DashboardHome() {

  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (

    <div>

      <h1 className="text-2xl font-bold mb-4">
        Panel de control
      </h1>

      <p>
        Bienvenido al panel de administración de tu tienda.
      </p>

    </div>

  )
}