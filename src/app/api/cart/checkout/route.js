// src/app/api/cart/checkout/route.js
// REDIRECT: Este endpoint está obsoleto. Redirige a POST /api/orders
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Este endpoint está obsoleto. Usa POST /api/orders directamente.",
      redirectTo: "/api/orders",
    },
    { status: 410 }
  );
}
