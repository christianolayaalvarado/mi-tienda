import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* POST: validar código de referido */
export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { referrer: { select: { id: true, name: true } } },
    });

    if (!referral) {
      return NextResponse.json({ valid: false, error: "Código no válido" });
    }

    return NextResponse.json({
      valid: true,
      referrerName: referral.referrer?.name || "Un amigo",
    });
  } catch (error) {
    console.error("Error validating referral:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
