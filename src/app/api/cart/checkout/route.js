import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return Response.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // Validar stock y restar
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });

      if (!product) {
        return Response.json({ error: `Producto ${item.title} no existe` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return Response.json({ error: `Stock insuficiente para ${item.title}` }, { status: 400 });
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity },
      });
    }

    // Limpiar carrito
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return Response.json({ error: "Error realizando checkout" }, { status: 500 });
  }
}