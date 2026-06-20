// src/lib/email.js
import nodemailer from "nodemailer";
import { proofTemplate, paymentTemplate } from "./emailTemplates";

const defaultFrom = `"${process.env.FROM_NAME || "Tu Tienda"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER || "no-reply@example.com"}>`;

// Transporters preconfigurados (opcional)
const transporters = {
  gmail: process.env.GMAIL_USER && process.env.GMAIL_PASS ? nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  }) : null,

  outlook: process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS ? nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: { user: process.env.OUTLOOK_USER, pass: process.env.OUTLOOK_PASS },
  }) : null,

  yahoo: process.env.YAHOO_USER && process.env.YAHOO_PASS ? nodemailer.createTransport({
    host: "smtp.mail.yahoo.com",
    port: 465,
    secure: true,
    auth: { user: process.env.YAHOO_USER, pass: process.env.YAHOO_PASS },
  }) : null,

  custom: (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === "true"),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }) : null,
};

// Verificar transporters disponibles (opcional, útil en startup)
async function verifyTransporters() {
  for (const key of Object.keys(transporters)) {
    const t = transporters[key];
    if (!t) continue;
    try {
      await t.verify();
      console.log(`[email] transporter ${key} verified`);
    } catch (err) {
      console.warn(`[email] transporter ${key} verification failed:`, err.message || err);
    }
  }
}
verifyTransporters().catch(() => { });

// Elegir transporter: si provider no está configurado, usar custom o lanzar error
function getTransporter(provider = "custom") {
  const t = transporters[provider];
  if (t) return t;
  if (transporters.custom) return transporters.custom;
  throw new Error("No SMTP transporter configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or provider-specific env vars.");
}

async function sendMail({ to, subject, html, provider }) {
  const transporter = getTransporter(provider);
  const from = defaultFrom;
  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`[email] sent to ${to} via ${provider || "custom"} messageId=${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email] sendMail error to ${to} via ${provider || "custom"}:`, err);
    throw err;
  }
}

// Exports
export const sendProofReceivedEmail = async ({ to, orderId, provider = "custom" }) => {
  return sendMail({
    to,
    subject: "Comprobante recibido",
    html: proofTemplate(orderId),
    provider,
  });
};

export const sendPaymentConfirmedEmail = async ({ to, orderId, provider = "custom" }) => {
  return sendMail({
    to,
    subject: "Pago confirmado",
    html: paymentTemplate(orderId),
    provider,
  });
};

export const sendVerificationCodeEmail = async ({ to, code, provider = "custom" }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verificación de cuenta</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size: 24px; font-weight: bold; color: #2c3e50;">${code}</p>
      <p>Este código expira en 10 minutos.</p>
    </div>
  `;
  return sendMail({ to, subject: "Código de verificación", html, provider });
};
