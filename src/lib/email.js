import nodemailer from "nodemailer";
import { proofTemplate, paymentTemplate } from "./emailTemplates";

const defaultFrom = `"${process.env.FROM_NAME || "Tu Tienda"}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`;

const transporters = {
  gmail:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE === "true" || true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
      : null,

  custom:
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      : null,
};

function getTransporter(provider = "gmail") {
  const t = transporters[provider] || transporters.custom;
  if (!t) {
    throw new Error(
      "No SMTP transporter configurado. Define EMAIL_USER/EMAIL_PASS o SMTP_* en .env"
    );
  }
  return t;
}

async function sendMail({ to, subject, html, provider }) {
  const transporter = getTransporter(provider);
  const from = defaultFrom;
  const info = await transporter.sendMail({ from, to, subject, html });
  console.log(
    `[email] enviado a ${to} via ${provider || "custom"} messageId=${info.messageId}`
  );
  return info;
}

export const sendVerificationCodeEmail = async ({
  to,
  code,
  provider = "gmail",
}) => {
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

export const sendProofReceivedEmail = async ({
  to,
  orderId,
  provider = "gmail",
}) =>
  sendMail({
    to,
    subject: "Comprobante recibido",
    html: proofTemplate(orderId),
    provider,
  });

export const sendPaymentConfirmedEmail = async ({
  to,
  orderId,
  provider = "gmail",
}) =>
  sendMail({
    to,
    subject: "Pago confirmado",
    html: paymentTemplate(orderId),
    provider,
  });