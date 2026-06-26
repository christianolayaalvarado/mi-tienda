// src/lib/rateLimit.js
// Rate limiter simple en memoria para endpoints de auth

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key) {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.start > WINDOW_MS) {
    attempts.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  record.count++;

  if (record.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.start)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

// Limpiar registros viejos cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now - record.start > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);
