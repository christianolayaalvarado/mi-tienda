import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);

    if (!authUser?.email) {
      return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        emailVerified: true,
        selectedMascot: true,
        stores: { select: { name: true, code: true }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado" }, { status: 401 });
    }

    // Detect stale credentials token when NextAuth session exists
    let hasSessionCookie = false;
    let hasOldToken = false;
    try {
      const cookieStore = await cookies();
      hasSessionCookie = !!(cookieStore.get("next-auth.session-token")?.value || cookieStore.get("__Secure-next-auth.session-token")?.value);
      hasOldToken = !!cookieStore.get("token")?.value;
    } catch {}
    // Fallback to req.headers
    if (!hasSessionCookie && !hasOldToken && req?.headers?.get) {
      const cc = req.headers.get("cookie") || "";
      hasSessionCookie = cc.includes("next-auth.session-token");
      hasOldToken = cc.includes("token=");
    }
    const shouldClearOldToken = hasSessionCookie && hasOldToken;

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        emailVerified: user.emailVerified,
        selectedMascot: user.selectedMascot,
        store: user.stores?.[0]?.name || null,
        storeCode: user.stores?.[0]?.code || null,
      },
    });

    if (shouldClearOldToken) {
      response.headers.append(
        "Set-Cookie",
        "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
      );
    }

    return response;
  } catch (err) {
    console.error("[/api/auth/me] error:", err?.message || err);
    return NextResponse.json({ ok: false, message: "Error interno" }, { status: 500 });
  }
}
