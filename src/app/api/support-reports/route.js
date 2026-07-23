import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

function getDevice(userAgent) {
  if (!userAgent) return "Unknown";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Otro";
}

function getBrowser(userAgent) {
  if (!userAgent) return "Unknown";
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return "Safari";
  if (/edge/i.test(userAgent)) return "Edge";
  return "Otro";
}

// POST /api/support-reports — create a report
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { category, description, email, url } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json({ error: "La descripción debe tener al menos 5 caracteres" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const device = getDevice(userAgent);
    const browser = getBrowser(userAgent);

    let userId = null;
    try {
      const user = await getServerAuthUser(req);
      if (user?.id) userId = user.id;
    } catch {}

    const report = await prisma.supportReport.create({
      data: {
        userId,
        email: email || null,
        category: category || "bug",
        description: description.trim().slice(0, 2000),
        url: url || null,
        device,
        browser,
      },
    });

    // Send email alert
    try {
      const { sendMail } = await import("@/lib/email");
      const adminEmail = "christianolayaalvarado@gmail.com";
      const categoryLabels = { bug: "🐛 Bug", suggestion: "💡 Sugerencia", complaint: "⚠️ Queja", other: "📝 Otro" };
      const label = categoryLabels[category] || "📝 Reporte";

      await sendMail({
        to: adminEmail,
        subject: `${label}: ${description.slice(0, 60)}...`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#1f2937">${label}</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Categoría:</td><td style="padding:8px">${label}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Descripción:</td><td style="padding:8px">${description}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Dispositivo:</td><td style="padding:8px">${device}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Navegador:</td><td style="padding:8px">${browser}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">URL:</td><td style="padding:8px"><a href="${url || "N/A"}">${url || "N/A"}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Email:</td><td style="padding:8px">${email || "No proporcionado"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;color:#6b7280">Report ID:</td><td style="padding:8px;font-size:12px;color:#9ca3af">${report.id}</td></tr>
            </table>
            <p style="margin-top:16px;font-size:12px;color:#9ca3af">Reporte desde Mi Tienda • ${new Date().toLocaleString("es-PE")}</p>
          </div>
        `,
      }).catch(() => {});
    } catch (e) {
      console.warn("Error sending report email:", e?.message);
    }

    return NextResponse.json({ success: true, id: report.id });
  } catch (err) {
    console.error("POST support-reports error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// GET /api/support-reports — admin: list reports with frequency
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const reports = await prisma.supportReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Frequency analysis
    const byCategory = {};
    const byDevice = {};
    const byBrowser = {};
    const byUrl = {};

    reports.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byDevice[r.device] = (byDevice[r.device] || 0) + 1;
      byBrowser[r.browser] = (byBrowser[r.browser] || 0) + 1;
      if (r.url) {
        const path = new URL(r.url).pathname;
        byUrl[path] = (byUrl[path] || 0) + 1;
      }
    });

    return NextResponse.json({
      reports,
      stats: {
        total: reports.length,
        byCategory: Object.entries(byCategory).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count),
        byDevice: Object.entries(byDevice).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count),
        byBrowser: Object.entries(byBrowser).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count),
        topUrls: Object.entries(byUrl).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 10),
      },
    });
  } catch (err) {
    console.error("GET support-reports error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// PATCH /api/support-reports — admin: update status
export async function PATCH(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { reportId, status, adminNote } = await req.json();
    if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

    const updated = await prisma.supportReport.update({
      where: { id: reportId },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });

    return NextResponse.json({ report: updated });
  } catch (err) {
    console.error("PATCH support-reports error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
