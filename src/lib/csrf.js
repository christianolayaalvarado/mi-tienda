// src/lib/csrf.js
// CSRF protection via Origin/Referer header validation
// Works with same-origin JWT cookie auth

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXTAUTH_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

function extractOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const normalized = origin.toLowerCase().replace(/\/+$/, "");
  return ALLOWED_ORIGINS.some(
    (allowed) => allowed.toLowerCase().replace(/\/+$/, "") === normalized
  );
}

/**
 * Validate CSRF on state-changing requests (POST, PUT, DELETE, PATCH).
 * Returns null if valid, or a Response if rejected.
 *
 * Usage in API routes:
 *   import { validateCsrf } from "@/lib/csrf";
 *   export async function POST(req) {
 *     const csrfError = validateCsrf(req);
 *     if (csrfError) return csrfError;
 *     // ... handle request
 *   }
 */
export function validateCsrf(req) {
  const method = req.method?.toUpperCase();

  // Only protect state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null;
  }

  // Allow requests with no Origin/Referer (server-to-server, curl, etc.)
  // This is a pragmatic choice - some legitimate clients don't send these headers.
  // The real protection comes from SameSite cookies + httpOnly.
  const origin = req.headers?.get?.("origin");
  const referer = req.headers?.get?.("referer");

  if (!origin && !referer) {
    return null;
  }

  // If Origin is present, validate it
  if (origin) {
    const requestOrigin = extractOrigin(origin);
    if (requestOrigin && !isAllowedOrigin(requestOrigin)) {
      return new Response(
        JSON.stringify({ ok: false, message: "CSRF validation failed: invalid origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // If Referer is present, validate it
  if (referer) {
    const refererOrigin = extractOrigin(referer);
    if (refererOrigin && !isAllowedOrigin(refererOrigin)) {
      return new Response(
        JSON.stringify({ ok: false, message: "CSRF validation failed: invalid referer" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return null;
}
