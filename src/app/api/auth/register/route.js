// src/app/api/auth/register/route.js
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Registro de usuario + creación de tienda + envío de código de verificación.
 * - Crea el usuario y la tienda en una transacción para evitar estados parciales.
 * - Genera un código de 6 dígitos y lo guarda en el usuario.
 * - Intenta enviar el correo; si falla, el registro sigue siendo exitoso pero se informa.
 *
 * Requiere que sendVerificationCodeEmail({ to, code }) esté implementada en src/lib/email.
 */

export async function POST(req) {
  try {
    // Parseo robusto del body
    let body = {};
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("[/api/auth/register] invalid JSON body:", parseErr?.message);
      return new Response(
        JSON.stringify({ ok: false, message: "Body inválido: JSON esperado" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password, name, storeName, referralCode } = body || {};

    if (!email || !password || !storeName) {
      return new Response(
        JSON.stringify({ ok: false, message: "Email, contraseña y nombre de tienda son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Rate limiting
    const rateKey = `register:${normalizedEmail}`;
    const { allowed, retryAfter } = checkRateLimit(rateKey);
    if (!allowed) {
      return new Response(
        JSON.stringify({ ok: false, message: `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.` }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Evitar duplicados
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuario ya registrado" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hashear contraseña
    const saltRounds = 10;
    const hashed = await bcrypt.hash(String(password), saltRounds);

    // Generar código de verificación (6 dígitos)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Generar código único para la tienda con sufijo aleatorio para reducir colisiones
    const storeCode = `STORE-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Crear usuario y tienda en una transacción
    let user;
    try {
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashed,
            name: name || null,
            role: "SELLER",
            emailVerified: false,
            verificationCode: code,
            verificationSentAt: new Date(),
            stores: {
              create: {
                name: storeName,
                code: storeCode,
              },
            },
          },
          include: { stores: true },
        });
        return created;
      });
      user = result;
    } catch (txErr) {
      console.error("[/api/auth/register] transaction error:", txErr);
      return new Response(
        JSON.stringify({ ok: false, message: "Error creando usuario" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Intentar enviar correo con el código; no fallar el registro si el envío falla
    let emailSent = true;
    try {
      // sendVerificationCodeEmail debe manejar su propio transporte y errores
      await sendVerificationCodeEmail({ to: user.email, code });
    } catch (emailErr) {
      emailSent = false;
      console.error("[/api/auth/register] sendVerificationCodeEmail failed:", emailErr?.message || emailErr);
    }

    // Procesar código de referido
    if (referralCode && typeof referralCode === "string") {
      try {
        const referral = await prisma.referral.findUnique({
          where: { code: referralCode.toUpperCase().trim() },
        });
        if (referral && referral.referrerId !== user.id) {
          await prisma.referral.update({
            where: { id: referral.id },
            data: { referredId: user.id, rewardGiven: true },
          });
          console.log(`[Register] Referral processed: ${referral.code} -> user ${user.id}`);
        }
      } catch (refErr) {
        console.error("[/api/auth/register] referral processing error:", refErr?.message || refErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: emailSent
          ? "Usuario creado. Código de verificación enviado."
          : "Usuario creado, pero fallo al enviar el correo de verificación.",
        id: user.id,
        name: user.name,
        email: user.email,
        stores: user.stores,
        emailSent,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Logging ampliado pero sin exponer datos sensibles
    console.error("[/api/auth/register] error:", err?.message || err, err?.stack || "");
    return new Response(
      JSON.stringify({ ok: false, message: "Error interno al registrar usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
