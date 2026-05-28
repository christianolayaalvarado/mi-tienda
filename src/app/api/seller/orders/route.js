import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 🔍 Buscar usuario con su tienda
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    })

    if (!user || user.stores.length === 0) {
      return NextResponse.json(
        { error: "No tienes tienda" },
        { status: 400 }
      )
    }

    const storeId = user.stores[0].id

    // 🔥 SOLO órdenes que contienen items de ESTA tienda
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            storeId: storeId,
          },
        },
      },
      include: {
        orderItems: {
          where: {
            storeId: storeId, // 🔥 CLAVE
          },
          include: {
            store: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true, // cliente
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ orders })

  } catch (error) {
    console.error("Error seller orders:", error)
    return NextResponse.json(
      { error: "Error obteniendo órdenes del seller" },
      { status: 500 }
    )
  }
}