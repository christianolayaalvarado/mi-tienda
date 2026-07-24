import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/cron/send-scheduled-campaigns — runs every hour via Vercel cron
export async function GET(req) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find scheduled campaigns whose time has come
    const pendingCampaigns = await prisma.campaign.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { lte: now },
      },
      take: 10,
    });

    if (pendingCampaigns.length === 0) {
      return NextResponse.json({ message: "No pending campaigns", processed: 0 });
    }

    const { sendMail } = await import("@/lib/email");

    // Get unsubscribed emails
    const unsubRows = await prisma.unsubscribe.findMany({ select: { email: true } });
    const unsubscribed = new Set(unsubRows.map((r) => r.email.toLowerCase()));

    let totalProcessed = 0;

    for (const campaign of pendingCampaigns) {
      try {
        // Get seller's products and contacts
        const stores = await prisma.store.findMany({
          where: { userId: campaign.userId },
          select: { id: true },
        });
        const storeIds = stores.map((s) => s.id);
        const products = await prisma.product.findMany({
          where: { storeId: { in: storeIds } },
          select: { id: true },
        });
        const productIds = products.map((p) => p.id);

        if (productIds.length === 0) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "failed", failedCount: 0 },
          });
          continue;
        }

        // Get contacts
        const views = await prisma.productView.findMany({
          where: {
            productId: { in: productIds },
            email: { not: null },
            OR: [
              { userAgent: null },
              { NOT: { userAgent: { contains: "gmail", mode: "insensitive" } } },
            ],
          },
          select: { email: true },
          distinct: ["email"],
        });

        let emails = views.map((v) => v.email).filter(Boolean);
        emails = emails.filter((e) => !unsubscribed.has(e.toLowerCase()));
        emails = emails.slice(0, 100);

        if (emails.length === 0) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "failed", failedCount: 0 },
          });
          continue;
        }

        // Build HTML based on template type
        let html = "";
        let subject = campaign.subject;

        if (campaign.templateType === "we-miss-you") {
          const { weMissYouTemplate } = await import("@/lib/emailTemplates");
          html = weMissYouTemplate("");
          subject = subject || "Te extrañamos! Vuelve a Mi Tienda";
        } else if (campaign.templateType === "weekly-offers") {
          const { weeklyOffersTemplate } = await import("@/lib/emailTemplates");
          html = weeklyOffersTemplate("");
          subject = subject || "Ofertas de la semana 🔥";
        } else if (campaign.templateType === "seasonal") {
          const { seasonalTemplate } = await import("@/lib/emailTemplates");
          html = seasonalTemplate("", "navidad");
          subject = subject || "Ofertas de temporada 🎉";
        }

        // Send emails
        let sent = 0;
        let failed = 0;
        for (const email of emails) {
          try {
            const personalizedHtml = html.replace(/__EMAIL__/g, encodeURIComponent(email));
            await sendMail({ to: email, subject, html: personalizedHtml });
            sent++;
            await new Promise((r) => setTimeout(r, 100));
          } catch {
            failed++;
          }
        }

        // Update campaign
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: "sent",
            sentCount: sent,
            failedCount: failed,
            recipientCount: emails.length,
            sentAt: now,
          },
        });

        totalProcessed++;
      } catch (err) {
        console.error(`Error processing campaign ${campaign.id}:`, err);
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "failed" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: `Processed ${totalProcessed} campaigns`,
      processed: totalProcessed,
    });
  } catch (err) {
    console.error("GET cron/send-scheduled-campaigns error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
