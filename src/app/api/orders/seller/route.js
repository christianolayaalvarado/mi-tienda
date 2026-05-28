import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

// ==============================
// 🔹 GET - ÓRDENES DEL USUARIO
// ==============================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page")) || 1
    const limit = 10
    const status = searchParams.get("status") || "all"
    const store = searchParams.get("store") || "all"
    const dateRange = searchParams.get("dateRange") || "30d"

    const skip = (page - 1) * limit

    // 🔥 Filtros dinámicos
    const where = {
      userId: session.user.id,
    }

    if (status !== "all") {
      where.status = status
    }

    // 🔥 Filtro por fecha
    if (dateRange !== "all") {
      const now = new Date()
      let fromDate = new Date()

      if (dateRange === "7d") {
        fromDate.setDate(now.getDate() - 7)
      } else if (dateRange === "30d") {
        fromDate.setDate(now.getDate() - 30)
      }

      where.createdAt = {
        gte: fromDate,
      }
    }

    // 🔥 Filtro por tienda
    if (store !== "all") {
      where.orderItems = {
        some: {
          storeId: store,
        },
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            store: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const totalOrders = await prisma.order.count({ where })
    const totalPages = Math.ceil(totalOrders / limit)

    return NextResponse.json({
      orders,
      totalPages,
      currentPage: page,
    })

  } catch (error) {
    console.error("Error GET /api/orders:", error)
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    )
  }
}

// ==============================
// 🔥 POST - CHECKOUT MULTI-TIENDA
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { items } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Carrito vacío" },
        { status: 400 }
      )
    }

    // 🔥 Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // ==============================
    // 🔹 AGRUPAR POR TIENDA
    // ==============================
    const groupedByStore = items.reduce((acc, item) => {
      const storeId = item.storeId

      if (!storeId) return acc

      if (!acc[storeId]) {
        acc[storeId] = []
      }

      acc[storeId].push(item)
      return acc
    }, {})

    // ==============================
    // 🔹 TOTAL
    // ==============================
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    // ==============================
    // 🔹 CREAR ORDEN PRINCIPAL
    // ==============================
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
      },
    })

    // ==============================
    // 🔥 CREAR SUB-ÓRDENES POR TIENDA
    // ==============================
    for (const storeId in groupedByStore) {
      const storeItems = groupedByStore[storeId]

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          storeId: storeId,
        },
      })

      // 🔥 Productos dentro de la sub-orden
      for (const item of storeItems) {
        await prisma.orderItemProduct.create({
          data: {
            orderItemId: orderItem.id,
            productId: item.productId,
            quantity: Number(item.quantity),
            price: Number(item.price),
          },
        })

        // 🔻 (Opcional pero recomendado) actualizar stock
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: Number(item.quantity),
            },
          },
        })
      }
    }

    // ==============================
    // 🧹 LIMPIAR CARRITO
    // ==============================
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id,
        },
      },
    })

    return NextResponse.json(
      { message: "Compra realizada con éxito", orderId: order.id },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error POST /api/orders:", error)

    return NextResponse.json(
      { error: "Error procesando la orden" },
      { status: 500 }
    )
  }
}