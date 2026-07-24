import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/seller/marketing — campaign history
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("GET seller/marketing error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// Helper: get unsubscribed emails
async function getUnsubscribedEmails() {
  const rows = await prisma.unsubscribe.findMany({ select: { email: true } });
  return new Set(rows.map((r) => r.email.toLowerCase()));
}

// Helper: get seller's product IDs
async function getSellerProductIds(userId) {
  const stores = await prisma.store.findMany({
    where: { userId },
    select: { id: true },
  });
  const storeIds = stores.map((s) => s.id);
  const products = await prisma.product.findMany({
    where: { storeId: { in: storeIds } },
    select: { id: true },
  });
  return products.map((p) => p.id);
}

// Helper: get contacts from ProductView (filtered)
async function getContactEmails(productIds, excludeEmails = []) {
  const views = await prisma.productView.findMany({
    where: {
      productId: { in: productIds },
      email: { not: null },
      NOT: {
        email: { in: excludeEmails },
      },
      OR: [
        { userAgent: null },
        { NOT: { userAgent: { contains: "gmail", mode: "insensitive" } } },
      ],
    },
    select: { email: true },
    distinct: ["email"],
  });
  return views.map((v) => v.email).filter(Boolean);
}

// Helper: send batch of emails (replaces __EMAIL__ placeholder for unsubscribe link)
async function sendBatch(emails, subject, html) {
  const { sendMail } = await import("@/lib/email");
  const baseUrl = process.env.NEXTAUTH_URL || "https://mi-tienda-app-beta.vercel.app";
  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    try {
      const personalizedHtml = html.replace(/__EMAIL__/g, encodeURIComponent(email));
      const personalizedSubject = subject.replace(/__EMAIL__/g, email);
      await sendMail({ to: email, subject: personalizedSubject, html: personalizedHtml });
      sent++;
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`Marketing email failed to ${email}:`, err?.message);
      failed++;
    }
  }
  return { sent, failed };
}

// Template: "Te extrañamos"
async function buildWeMissYouTemplate(sellerId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveUsers = await prisma.user.findMany({
    where: {
      emailVerified: true,
      createdAt: { lt: thirtyDaysAgo },
      orders: { none: { createdAt: { gte: thirtyDaysAgo } } },
    },
    select: { email: true, name: true },
    take: 100,
  });
  const emails = inactiveUsers
    .map((u) => u.email)
    .filter((e) => e && e !== "admin@demo.com");
  const { weMissYouTemplate } = await import("@/lib/emailTemplates");
  return { emails, html: weMissYouTemplate(""), subject: "Te extrañamos! Vuelve a Mi Tienda" };
}

// Template: "Ofertas de la semana"
async function buildWeeklyOffersTemplate(sellerId) {
  const productIds = await getSellerProductIds(sellerId);
  const products = await prisma.product.findMany({
    where: {
      storeId: { in: (await prisma.store.findMany({ where: { userId: sellerId }, select: { id: true } })).map((s) => s.id) },
      discountPct: { gte: 10 },
    },
    select: { id: true, title: true, price: true, originalPrice: true, images: true, discountPct: true },
    take: 4,
  });
  const contacts = await getContactEmails(productIds, ["admin@demo.com"]);
  const { weeklyOffersTemplate } = await import("@/lib/emailTemplates");
  return { emails: contacts, html: weeklyOffersTemplate(""), subject: "Ofertas de la semana 🔥 - Mi Tienda" };
}

// Template: "Email de temporada"
async function buildSeasonalTemplate(sellerId, season) {
  const validSeasons = ["black-friday", "navidad", "verano", "san-valentin", "dia-madre", "cyber-monday", "inicio-ano"];
  if (!validSeasons.includes(season)) {
    throw new Error("Temporada invalida");
  }
  const productIds = await getSellerProductIds(sellerId);
  const contacts = await getContactEmails(productIds, ["admin@demo.com"]);
  const { seasonalTemplate } = await import("@/lib/emailTemplates");
  const seasonNames = {
    "black-friday": "Black Friday",
    navidad: "Navidad",
    verano: "Verano",
    "san-valentin": "San Valentin",
    "dia-madre": "Dia de la Madre",
    "cyber-monday": "Cyber Monday",
    "inicio-ano": "Inicio de Ano",
  };
  return { emails: contacts, html: seasonalTemplate("", season), subject: `${seasonNames[season]} - Ofertas especiales 🔥` };
}

// POST /api/seller/marketing — send or schedule campaign
export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, html, targetEmails, templateType, season, scheduledAt } = body;

    // Unsubscribed emails
    const unsubscribed = await getUnsubscribedEmails();

    let campaignSubject = subject;
    let campaignHtml = html;
    let emails = [];
    let resolvedTemplateType = templateType || "custom";

    if (templateType === "we-miss-you") {
      const result = await buildWeMissYouTemplate(user.id);
      emails = result.emails;
      campaignSubject = result.subject;
      campaignHtml = result.html;
    } else if (templateType === "weekly-offers") {
      const result = await buildWeeklyOffersTemplate(user.id);
      emails = result.emails;
      campaignSubject = result.subject;
      campaignHtml = result.html;
    } else if (templateType === "seasonal") {
      const result = await buildSeasonalTemplate(user.id, season || "navidad");
      emails = result.emails;
      campaignSubject = result.subject;
      campaignHtml = result.html;
    } else {
      // Custom campaign
      if (!subject || !html) {
        return NextResponse.json({ error: "subject y html requeridos" }, { status: 400 });
      }
      if (subject.length < 3 || subject.length > 200) {
        return NextResponse.json({ error: "El asunto debe tener 3-200 caracteres" }, { status: 400 });
      }
      if (targetEmails && Array.isArray(targetEmails) && targetEmails.length > 0) {
        emails = targetEmails.filter((e) => e && typeof e === "string" && e.includes("@"));
      } else {
        const productIds = await getSellerProductIds(user.id);
        emails = await getContactEmails(productIds, ["admin@demo.com", user.email]);
      }
    }

    // Filter out unsubscribed
    emails = emails.filter((e) => !unsubscribed.has(e.toLowerCase()));

    if (emails.length === 0) {
      return NextResponse.json({ error: "No hay contactos con email" }, { status: 400 });
    }

    const maxEmails = Math.min(emails.length, 100);
    const toSend = emails.slice(0, maxEmails);

    // Schedule or send now
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return NextResponse.json({ error: "Fecha de programacion invalida" }, { status: 400 });
      }

      const campaign = await prisma.campaign.create({
        data: {
          userId: user.id,
          subject: campaignSubject,
          recipientCount: toSend.length,
          templateType: resolvedTemplateType,
          status: "scheduled",
          scheduledAt: scheduledDate,
        },
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        campaignId: campaign.id,
        scheduledAt: scheduledDate.toISOString(),
        total: toSend.length,
        message: `Campana programada para ${scheduledDate.toLocaleString("es-PE")}. Se enviara automaticamente.`,
      });
    }

    // Send now
    const { sent, failed } = await sendBatch(toSend, campaignSubject, campaignHtml);

    // Create campaign record
    await prisma.campaign.create({
      data: {
        userId: user.id,
        subject: campaignSubject,
        recipientCount: toSend.length,
        sentCount: sent,
        failedCount: failed,
        templateType: resolvedTemplateType,
        status: "sent",
      },
    });

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
