import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/getJwtSecret";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const cookieNames = cookieHeader
      ? cookieHeader.split(";").map((c) => c.trim().split("=")[0])
      : [];

    const hasToken = cookieNames.includes("token");
    const hasNextAuth = cookieNames.includes("next-auth.session-token");
    const hasSecureNextAuth = cookieNames.includes("__Secure-next-auth.session-token");

    let tokenResult = null;
    if (hasToken) {
      const raw = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("token="));
      const value = raw ? raw.split("=").slice(1).join("=") : null;
      if (value) {
        try {
          const decoded = decodeURIComponent(value);
          const payload = jwt.verify(decoded, getJwtSecret());
          tokenResult = { valid: true, email: payload.email, role: payload.role };
        } catch (err) {
          tokenResult = { valid: false, error: err.message };
        }
      }
    }

    let nextAuthResult = null;
    const naRaw = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("next-auth.session-token=") || c.startsWith("__Secure-next-auth.session-token="));
    if (naRaw) {
      const naValue = naRaw.split("=").slice(1).join("=");
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET);
        const decoded = decodeURIComponent(naValue);
        const { payload } = await jwtVerify(decoded, secret);
        nextAuthResult = { valid: true, email: payload.email };
      } catch (err) {
        nextAuthResult = { valid: false, error: err.message };
      }
    }

    return NextResponse.json({
      cookieHeaderLength: cookieHeader.length,
      cookieNames,
      hasToken,
      hasNextAuth,
      hasSecureNextAuth,
      tokenResult,
      nextAuthResult,
      userAgent: req.headers.get("user-agent")?.substring(0, 80),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
