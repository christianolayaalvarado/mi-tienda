import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    // Obtener carrito del usuario
    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return Response.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // Validar stock antes de procesar
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return Response.json({ error: `Producto ${item.title} no existe` }, { status: 404 });
      if (product.stock < item.quantity)
        return Response.json({ error: `Stock insuficiente para ${item.title}` }, { status: 400 });
    }

    // Restar stock y crear registro de orden (opcional)
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Limpiar carrito
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return Response.json({ success: true, message: "Compra realizada con éxito" });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return Response.json({ error: "Error al procesar el checkout" }, { status: 500 });
  }
}