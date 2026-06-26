// Shared cookie helpers for custom JWT auth + NextAuth (dev and production names).

const AUTH_COOKIE_NAMES = [
  "token",
  "refreshToken",
  // NextAuth — development
  "next-auth.session-token",
  "next-auth.callback-url",
  "next-auth.csrf-token",
  // NextAuth — production (useSecureCookies)
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "__Host-next-auth.csrf-token",
];

function cookieBaseOpts() {
  const sameSite = process.env.COOKIE_SAMESITE || "Lax";
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const domain = process.env.COOKIE_DOMAIN ? `; Domain=${process.env.COOKIE_DOMAIN}` : "";
  const expires = `; Expires=${new Date(0).toUTCString()}; Max-Age=0`;
  return { sameSite, secureFlag, domain, expires };
}

function buildClearCookie(name, { httpOnly = true, hostPrefix = false } = {}) {
  const { sameSite, secureFlag, domain, expires } = cookieBaseOpts();
  const path = "; Path=/";
  const httpOnlyAttr = httpOnly ? "; HttpOnly" : "";
  // __Host- cookies must not include Domain
  const domainAttr = hostPrefix ? "" : domain;
  return `${name}=${expires}${path}${domainAttr}${httpOnlyAttr}; SameSite=${sameSite}${secureFlag}`;
}

/** Set-Cookie headers that expire every auth-related cookie we use. */
export function buildAuthClearCookieHeaders() {
  return AUTH_COOKIE_NAMES.map((name) => {
    const hostPrefix = name.startsWith("__Host-");
    const httpOnly = !name.includes("callback-url");
    return buildClearCookie(name, { httpOnly, hostPrefix });
  });
}

export { AUTH_COOKIE_NAMES };
