import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/unsubscribe?email=xxx — unsubscribe from marketing emails
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert to avoid duplicates
    const existing = await prisma.unsubscribe.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      await prisma.unsubscribe.create({
        data: { email: normalizedEmail },
      });
    }

    // Redirect to confirmation page
    return NextResponse.redirect(new URL(`/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&success=true`, req.url));
  } catch (err) {
    console.error("GET unsubscribe error:", err);
    return NextResponse.redirect(new URL("/unsubscribe?error=true", req.url));
  }
}
