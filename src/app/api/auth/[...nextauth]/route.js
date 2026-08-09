// src/app/api/auth/[...nextauth]/route.js
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

// __non_webpack_require__ bypasses webpack to use Node.js native require
// This fixes CJS/ESM interop issues with next-auth default export
// eslint-disable-next-line no-undef
const NextAuth = __non_webpack_require__("next-auth").default;

const nextAuthHandler = NextAuth(authOptions);

async function handleRequest(req, ctx) {
  const response = await nextAuthHandler(req, ctx);

  const url = req.nextUrl;
  const isOAuthCallback =
    url.pathname.includes("/api/auth/callback/") &&
    (url.pathname.includes("google") || url.pathname.includes("facebook"));

  if (!isOAuthCallback) return response;

  const location = response.headers?.get?.("location") || response.headers?.get?.("Location");
  if (!location) return response;

  const newResponse = NextResponse.redirect(location, { status: 302 });

  response.headers?.forEach?.((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      newResponse.headers.append(key, value);
    }
  });

  newResponse.headers.append(
    "Set-Cookie",
    "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  newResponse.headers.append(
    "Set-Cookie",
    "refreshToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );

  return newResponse;
}

export { handleRequest as GET, handleRequest as POST };
