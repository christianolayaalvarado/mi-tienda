// lib/useSessionCheck.js
export async function fetchSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch (err) {
    return null;
  }
}
