import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import { sendWeMissYouEmail, sendWeeklyOffersEmail, sendSeasonalEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/* POST: enviar emails de marketing */
export async function POST(req) {
  try {
    const session = await getServerAuthUser(req);
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, season } = body;

    if (!type) {
      return NextResponse.json({ error: "type requerido" }, { status: 400 });
    }

    let sentCount = 0;
    let errors = 0;

    if (type === "we-miss-you") {
      // Usuarios que no se loguean hace >30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveUsers = await prisma.user.findMany({
        where: {
          emailVerified: true,
          createdAt: { lt: thirtyDaysAgo },
          // Excluir usuarios cuyo último pedido fue hace menos de 30 días
          orders: {
            none: {
              createdAt: { gte: thirtyDaysAgo },
            },
          },
        },
        select: { email: true, name: true },
        take: 50,
      });

      for (const user of inactiveUsers) {
        try {
          await sendWeMissYouEmail({ to: user.email, userName: user.name });
          sentCount++;
        } catch (e) {
          console.error(`Error enviando "Te extrañamos" a ${user.email}:`, e.message);
          errors++;
        }
      }

      return NextResponse.json({
        ok: true,
        type: "we-miss-you",
        total: inactiveUsers.length,
        sent: sentCount,
        errors,
      });
    }

    if (type === "weekly-offers") {
      // Productos con descuento
      const discountedProducts = await prisma.product.findMany({
        where: {
          originalPrice: { not: null },
          discountPct: { gte: 10 },
        },
        orderBy: { discountPct: "desc" },
        take: 8,
      });

      if (discountedProducts.length === 0) {
        return NextResponse.json({ ok: false, message: "No hay productos con descuento suficiente" });
      }

      // Enviar a todos los usuarios verificados
      const users = await prisma.user.findMany({
        where: { emailVerified: true },
        select: { email: true, name: true },
        take: 100,
      });

      for (const user of users) {
        try {
          await sendWeeklyOffersEmail({ to: user.email, userName: user.name, products: discountedProducts });
          sentCount++;
        } catch (e) {
          console.error(`Error enviando ofertas a ${user.email}:`, e.message);
          errors++;
        }
      }

      return NextResponse.json({
        ok: true,
        type: "weekly-offers",
        productsCount: discountedProducts.length,
        total: users.length,
        sent: sentCount,
        errors,
      });
    }

    if (type === "seasonal") {
      const validSeasons = ["black-friday", "navidad", "verano", "san-valentin", "dia-madre", "cyber-monday", "inicio-ano"];
      if (!season || !validSeasons.includes(season)) {
        return NextResponse.json({ error: `season requerido. Válidos: ${validSeasons.join(", ")}` }, { status: 400 });
      }

      const users = await prisma.user.findMany({
        where: { emailVerified: true },
        select: { email: true, name: true },
        take: 100,
      });

      for (const user of users) {
        try {
          await sendSeasonalEmail({ to: user.email, userName: user.name, season });
          sentCount++;
        } catch (e) {
          console.error(`Error enviando email estacional a ${user.email}:`, e.message);
          errors++;
        }
      }

      return NextResponse.json({
        ok: true,
        type: "seasonal",
        season,
        total: users.length,
        sent: sentCount,
        errors,
      });
    }

    return NextResponse.json({ error: `type "${type}" no válido` }, { status: 400 });
  } catch (error) {
    console.error("Error en marketing API:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
