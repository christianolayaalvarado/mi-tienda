import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    const { items } = await req.json()

    // 🔍 buscar o crear carrito
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: { items: true },
      })
    }

    // 🧠 merge inteligente
    const map = new Map()

    // DB items
    cart.items.forEach(item => {
      map.set(item.productId, { ...item })
    })

    // Local items
    items.forEach(item => {
      if (map.has(item.productId)) {
        map.get(item.productId).quantity += item.quantity
      } else {
        map.set(item.productId, {
          productId: item.productId,
          quantity: item.quantity,
        })
      }
    })

    const mergedItems = Array.from(map.values())

    // 🔥 borrar items antiguos
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    // 🔥 crear nuevos
    await prisma.cartItem.createMany({
      data: mergedItems.map(item => ({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("SYNC ERROR:", error)
    return Response.json({ error: "Error en sync" }, { status: 500 })
  }
}