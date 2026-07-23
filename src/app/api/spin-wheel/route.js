import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const PRIZES = [
  { type: "percentage_discount", value: 5, label: "5% descuento", weight: 30 },
  { type: "percentage_discount", value: 10, label: "10% descuento", weight: 25 },
  { type: "percentage_discount", value: 15, label: "15% descuento", weight: 15 },
  { type: "percentage_discount", value: 20, label: "20% descuento", weight: 8 },
  { type: "percentage_discount", value: 30, label: "30% descuento", weight: 3 },
  { type: "fixed_discount", value: 5, label: "S/.5 descuento", weight: 20 },
  { type: "fixed_discount", value: 10, label: "S/.10 descuento", weight: 12 },
  { type: "fixed_discount", value: 20, label: "S/.20 descuento", weight: 5 },
  { type: "free_shipping", value: 0, label: "Envio gratis", weight: 18 },
  { type: "percentage_discount", value: 50, label: "50% descuento", weight: 1 },
  { type: "fixed_discount", value: 50, label: "S/.50 descuento", weight: 1 },
  { type: "no_prize", value: 0, label: "Intenta de nuevo", weight: 22 },
];

function pickPrize() {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of PRIZES) {
    random -= prize.weight;
    if (random <= 0) return prize;
  }
  return PRIZES[0];
}

function generateCode() {
  return "SPIN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para girar" }, { status: 401 });
    }

    const lastPrize = await prisma.spinWheelPrize.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastPrize) {
      const hoursSinceLastSpin = (Date.now() - new Date(lastPrize.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSpin < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceLastSpin);
        return NextResponse.json({ error: `Puedes girar en ${hoursLeft}h`, cooldown: hoursLeft }, { status: 429 });
      }
    }

    const prize = pickPrize();

    const record = await prisma.spinWheelPrize.create({
      data: {
        userId: user.id,
        prizeType: prize.type,
        prizeValue: prize.value,
        code: generateCode(),
        used: prize.type === "no_prize",
        expiresAt: prize.type !== "no_prize"
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    return NextResponse.json({
      prize: {
        type: prize.type,
        value: prize.value,
        label: prize.label,
        code: record.code,
        expiresAt: record.expiresAt,
      },
    });
  } catch (err) {
    console.error("POST spin-wheel error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ prizes: [], canSpin: false });
    }

    const prizes = await prisma.spinWheelPrize.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const lastPrize = prizes[0];
    let canSpin = true;
    let cooldownHours = 0;
    if (lastPrize) {
      const hoursSinceLastSpin = (Date.now() - new Date(lastPrize.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSpin < 24) {
        canSpin = false;
        cooldownHours = Math.ceil(24 - hoursSinceLastSpin);
      }
    }

    return NextResponse.json({ prizes, canSpin, cooldownHours });
  } catch (err) {
    console.error("GET spin-wheel error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
