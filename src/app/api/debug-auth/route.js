// src/app/api/debug-auth/route.js
export async function GET() {
  try {
    const mod = await import("@/lib/authOptions");
    return new Response(JSON.stringify({ ok: true, hasAuthOptions: !!mod.authOptions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
