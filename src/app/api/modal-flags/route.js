import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const flags = await prisma.modalFlag.findMany({
      where: { enabled: true },
      select: { key: true, label: true, audience: true, activateAt: true, deactivateAt: true, metadata: true },
    });

    const now = new Date();
    const active = flags.filter((f) => {
      if (f.activateAt && f.activateAt > now) return false;
      if (f.deactivateAt && f.deactivateAt < now) return false;
      return true;
    });

    const url = new URL(req.url);
    const isLoggedIn = url.searchParams.get("loggedIn") === "true";

    const filtered = active.filter((f) => {
      if (f.audience === "registered") return isLoggedIn;
      if (f.audience === "unregistered") return !isLoggedIn;
      return true;
    });

    return NextResponse.json({
      flags: filtered.map((f) => ({ key: f.key, label: f.label, metadata: f.metadata })),
    });
  } catch (err) {
    console.error("GET /api/modal-flags error:", err);
    return NextResponse.json({ flags: [] });
  }
}
