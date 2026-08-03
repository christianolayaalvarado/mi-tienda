import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Esta ruta fue deshabilitada. Usa /api/upgrade-request con verificacion de pago del admin." },
    { status: 403 }
  );
}
