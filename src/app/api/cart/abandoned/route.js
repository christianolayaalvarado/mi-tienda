import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAbandonedCartReminder } from "@/lib/email";

export async function POST(req) {
  try {
    const { userId, email, cartItems } = await req.json();

    if (!email || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

    await sendAbandonedCartReminder({
      to: email,
      cartItems,
      total,
    });

    return NextResponse.json({ ok: true, message: "Reminder sent" });
  } catch (error) {
    console.error("Abandoned cart email error:", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}
