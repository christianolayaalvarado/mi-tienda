// src/lib/getJwtSecret.js
// Centralized JWT secret getter - throws if not configured

const FALLBACK_BLOCKLIST = ["change_this_secret", "secret", "supersecret123", "miclave_super_segura_123"];

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "[FATAL] JWT_SECRET or NEXTAUTH_SECRET env variable is not set. " +
      "Authentication will not work. Set a strong random secret in Vercel environment variables."
    );
  }

  if (FALLBACK_BLOCKLIST.includes(secret)) {
    throw new Error(
      `[FATAL] JWT secret "${secret}" is a known weak/default value. ` +
      "Replace it with a strong random string (64+ chars). Generate one with: " +
      "node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  return secret;
}
