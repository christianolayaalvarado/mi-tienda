import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    // 🔥 Generar código único
    const code = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()

    const store = await prisma.store.create({
      data: {
        name,
        code,
        userId: session.user.id,
      },
    })

    return NextResponse.json(store)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error creando tienda" }, { status: 500 })
  }
}