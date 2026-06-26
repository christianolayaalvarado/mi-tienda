import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthUser } from "@/lib/serverAuth"

export async function POST(req) {
  try {
    const authUser = await getServerAuthUser(req)

    if (!authUser?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name } = await req.json().catch(() => ({}))

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    // 🔥 Generar código único
    const code = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()

    const store = await prisma.store.create({
      data: {
        name,
        code,
        userId: authUser.id,
      },
    })

    return NextResponse.json(store)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error creando tienda" }, { status: 500 })
  }
}