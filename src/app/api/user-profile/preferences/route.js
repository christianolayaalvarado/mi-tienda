import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";
import { BUILTIN_PALETTES, PREMIUM_PALETTES, isValidHex } from "@/lib/palettes";

export const dynamic = "force-dynamic";

const MAX_CUSTOM_PALETTES = 6;
const MAX_COLORS = 5;

/* ── GET ──────────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const user = await getAuthUserFromCookie();
    if (!user?.email) {
      return NextResponse.json({
        theme: "default",
        selectedPalette: "builtin-default",
        customPalettes: [],
        unlockedPremium: [],
        totalSales: 0,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({
        theme: "default",
        selectedPalette: "builtin-default",
        customPalettes: [],
        unlockedPremium: [],
        totalSales: 0,
      });
    }

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ADMIN";

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: dbUser.id },
    });

    const totalSales = await prisma.orderItem.count({
      where: {
        order: {
          store: { userId: dbUser.id },
        },
      },
    });

    // Admin users get all premium palettes unlocked
    const unlockedPremium = isAdmin
      ? PREMIUM_PALETTES.map((p) => p.id)
      : PREMIUM_PALETTES.filter((p) => totalSales >= p.requiredSales).map((p) => p.id);

    return NextResponse.json({
      theme: prefs?.theme || "default",
      selectedPalette: prefs?.selectedPalette || "builtin-default",
      customPalettes: Array.isArray(prefs?.customPalettes) ? prefs.customPalettes : [],
      unlockedPremium,
      totalSales,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({
      theme: "default",
      selectedPalette: "builtin-default",
      customPalettes: [],
      unlockedPremium: [],
      totalSales: 0,
    });
  }
}

/* ── PUT ──────────────────────────────────────────────────────────── */

export async function PUT(req) {
  try {
    const user = await getAuthUserFromCookie();
    if (!user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = dbUser.role === "admin" || dbUser.role === "ADMIN";

    const body = await req.json();
    const { theme, selectedPalette, customPalettes, editPalette } = body;

    const validThemes = ["default", "pastel", "grayscale", "vibrant", "dark"];
    if (theme !== undefined && !validThemes.includes(theme)) {
      return NextResponse.json({ error: "Tema inválido" }, { status: 400 });
    }

    if (selectedPalette !== undefined) {
      const allBuiltin = BUILTIN_PALETTES.map((p) => p.id);
      const allPremium = PREMIUM_PALETTES.map((p) => p.id);

      if (!allBuiltin.includes(selectedPalette) && !allPremium.includes(selectedPalette) && !selectedPalette.startsWith("custom-")) {
        return NextResponse.json({ error: "Paleta inválida" }, { status: 400 });
      }

      // Skip premium check for admin users
      if (allPremium.includes(selectedPalette) && !isAdmin) {
        const totalSales = await prisma.orderItem.count({
          where: { order: { store: { userId: dbUser.id } } },
        });
        const palette = PREMIUM_PALETTES.find((p) => p.id === selectedPalette);
        if (palette && totalSales < palette.requiredSales) {
          return NextResponse.json({ error: "Paleta premium no desbloqueada" }, { status: 403 });
        }
      }
    }

    if (editPalette) {
      const { id, name, colors } = editPalette;

      if (!id || !id.startsWith("custom-")) {
        return NextResponse.json({ error: "ID de paleta inválido" }, { status: 400 });
      }

      if (!name || typeof name !== "string" || name.length > 30) {
        return NextResponse.json({ error: "Nombre inválido (máx 30 chars)" }, { status: 400 });
      }

      if (!Array.isArray(colors) || colors.length !== MAX_COLORS) {
        return NextResponse.json({ error: "Se requieren exactamente 5 colores" }, { status: 400 });
      }

      if (!colors.every((c) => isValidHex(c))) {
        return NextResponse.json({ error: "Todos los colores deben ser hex válidos (#RRGGBB)" }, { status: 400 });
      }

      const prefs = await prisma.userPreferences.findUnique({
        where: { userId: dbUser.id },
      });

      let palettes = Array.isArray(prefs?.customPalettes) ? [...prefs.customPalettes] : [];

      const existing = palettes.findIndex((p) => p.id === id);
      if (existing >= 0) {
        palettes[existing] = { id, name, colors };
      } else {
        if (palettes.length >= MAX_CUSTOM_PALETTES) {
          return NextResponse.json({ error: `Máximo ${MAX_CUSTOM_PALETTES} paletas personalizadas` }, { status: 400 });
        }
        palettes.push({ id, name, colors });
      }

      await prisma.userPreferences.upsert({
        where: { userId: dbUser.id },
        update: { customPalettes: palettes },
        create: {
          userId: dbUser.id,
          theme: "default",
          selectedPalette: "builtin-default",
          customPalettes: palettes,
        },
      });

      return NextResponse.json({ success: true, customPalettes: palettes });
    }

    if (customPalettes !== undefined) {
      if (!Array.isArray(customPalettes)) {
        return NextResponse.json({ error: "customPalettes debe ser un array" }, { status: 400 });
      }

      if (customPalettes.length > MAX_CUSTOM_PALETTES) {
        return NextResponse.json({ error: `Máximo ${MAX_CUSTOM_PALETTES} paletas personalizadas` }, { status: 400 });
      }

      for (const p of customPalettes) {
        if (!p.id || !p.name || !Array.isArray(p.colors) || p.colors.length !== MAX_COLORS) {
          return NextResponse.json({ error: "Formato de paleta inválido" }, { status: 400 });
        }
        if (!p.colors.every((c) => isValidHex(c))) {
          return NextResponse.json({ error: "Colores hex inválidos" }, { status: 400 });
        }
      }
    }

    const updateData = {};
    if (theme !== undefined) updateData.theme = theme;
    if (selectedPalette !== undefined) updateData.selectedPalette = selectedPalette;
    if (customPalettes !== undefined) updateData.customPalettes = customPalettes;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: dbUser.id },
      update: updateData,
      create: {
        userId: dbUser.id,
        theme: theme || "default",
        selectedPalette: selectedPalette || "builtin-default",
        customPalettes: customPalettes || [],
      },
    });

    return NextResponse.json({
      theme: prefs.theme,
      selectedPalette: prefs.selectedPalette,
      customPalettes: prefs.customPalettes,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
