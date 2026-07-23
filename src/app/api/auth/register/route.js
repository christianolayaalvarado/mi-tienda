// src/app/api/auth/register/route.js
import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Registro de usuario (plan FREE — comprador).
 * No crea tienda. La tienda se crea al hacer upgrade a FULL.
 */

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("[/api/auth/register] invalid JSON body:", parseErr?.message);
      return new Response(
        JSON.stringify({ ok: false, message: "Body invalido: JSON esperado" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password, name, referralCode } = body || {};

    if (!email || !password) {
      return new Response(
        JSON.stringify({ ok: false, message: "Email y contrasena son requeridos" }),
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

    // Hashear contrasena
    const saltRounds = 10;
    const hashed = await bcrypt.hash(String(password), saltRounds);

    // Generar codigo de verificacion (6 digitos)
    const code = crypto.randomInt(100000, 999999).toString();

    // Crear usuario (sin tienda, plan free)
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          name: name || null,
          role: "USER",
          plan: "free",
          emailVerified: false,
          verificationCode: code,
          verificationSentAt: new Date(),
        },
      });
    } catch (txErr) {
      console.error("[/api/auth/register] create user error:", txErr);
      return new Response(
        JSON.stringify({ ok: false, message: "Error creando usuario" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enviar correo de verificacion
    let emailSent = true;
    try {
      await sendVerificationCodeEmail({ to: user.email, code });
    } catch (emailErr) {
      emailSent = false;
      console.error("[/api/auth/register] sendVerificationCodeEmail failed:", emailErr?.message || emailErr);
    }

    // Procesar codigo de referido
    if (referralCode && typeof referralCode === "string") {
      try {
        const { addCoins } = await import("@/lib/coins");
        const referral = await prisma.referral.findUnique({
          where: { code: referralCode.toUpperCase().trim() },
        });
        if (referral && referral.referrerId !== user.id && !referral.rewardGiven) {
          await prisma.referral.update({
            where: { id: referral.id },
            data: { referredId: user.id, rewardGiven: true },
          });
          await addCoins(referral.referrerId, 100, "referral-inviter");
          await addCoins(user.id, 50, "referral-invited");
        }
      } catch (refErr) {
        console.error("[/api/auth/register] referral processing error:", refErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: emailSent
          ? "Usuario creado. Codigo de verificacion enviado."
          : "Usuario creado, pero fallo al enviar el correo de verificacion.",
        id: user.id,
        name: user.name,
        email: user.email,
        emailSent,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[/api/auth/register] error:", err?.message || err, err?.stack || "");
    return new Response(
      JSON.stringify({ ok: false, message: "Error interno al registrar usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
