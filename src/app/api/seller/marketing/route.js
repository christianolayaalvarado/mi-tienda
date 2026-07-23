import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// POST /api/seller/marketing — send marketing campaign
export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { subject, html, sendTo } = await req.json();

    if (!subject || !html) {
      return NextResponse.json({ error: "subject y html requeridos" }, { status: 400 });
    }

    if (subject.length < 3 || subject.length > 200) {
      return NextResponse.json({ error: "El asunto debe tener 3-200 caracteres" }, { status: 400 });
    }

    // Get seller's products
    const stores = await prisma.store.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);
    const products = await prisma.product.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    // Get contacts from product views
    const contacts = await prisma.productView.findMany({
      where: {
        productId: { in: productIds },
        email: { not: null },
      },
      select: { email: true },
      distinct: ["email"],
    });

    const emails = contacts.map((c) => c.email).filter(Boolean);

    if (emails.length === 0) {
      return NextResponse.json({ error: "No hay contactos con email" }, { status: 400 });
    }

    // Limit: Gmail free = 500/day, Workspace = 2000/day
    const maxEmails = Math.min(emails.length, 100);
    const toSend = emails.slice(0, maxEmails);

    // Send emails
    const { sendMail } = await import("@/lib/email");
    let sent = 0;
    let failed = 0;

    for (const email of toSend) {
      try {
        await sendMail({
          to: email,
          subject,
          html,
        });
        sent++;
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`Marketing email failed to ${email}:`, err?.message);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: emails.length,
      message: `Enviados: ${sent} | Fallidos: ${failed} | Total contactos: ${emails.length}`,
    });
  } catch (err) {
    console.error("POST seller/marketing error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
