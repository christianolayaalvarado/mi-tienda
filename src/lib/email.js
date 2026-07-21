// src/lib/email.js
import nodemailer from "nodemailer";
import {
  verificationCodeTemplate,
  proofTemplate,
  paymentTemplate,
  orderCreatedBuyerTemplate,
  orderCreatedSellerTemplate,
  paymentConfirmedBuyerTemplate,
  paymentConfirmedSellerTemplate,
  passwordResetTemplate,
  passwordResetSuccessTemplate,
  orderStatusTemplate,
  orderCancelledBuyerTemplate,
  orderCancelledSellerTemplate,
  weMissYouTemplate,
  weeklyOffersTemplate,
  seasonalTemplate,
  abandonedCartTemplate,
  lowStockTemplate,
} from "./emailTemplates";

const defaultFrom = `"${process.env.FROM_NAME || "Mi Tienda"}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`;

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("No SMTP configurado. Define SMTP_USER/SMTP_PASS o EMAIL_USER/EMAIL_PASS en .env");
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

export async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  const from = defaultFrom;

  try {
    await transporter.verify();
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`[email] ✅ enviado a ${to} | messageId=${info.messageId}`);
    return { ok: true, info };
  } catch (err) {
    console.error(`[email] ❌ error enviando a ${to}:`, err?.message || err);
    throw err;
  }
}

// ============================================================
// EXPORTS PÚBLICOS
// ============================================================

export const sendVerificationCodeEmail = async ({ to, code }) => {
  const ttlMinutes = Math.floor(Number(process.env.VERIFICATION_TTL_SECONDS || 900) / 60);
  return sendMail({
    to,
    subject: "Código de verificación - Mi Tienda",
    html: verificationCodeTemplate(code),
  });
};

export const sendProofReceivedEmail = async ({ to, orderNumber }) =>
  sendMail({ to, subject: "Comprobante recibido - Mi Tienda", html: proofTemplate(orderNumber) });

export const sendPaymentConfirmedEmail = async ({ to, orderNumber }) =>
  sendMail({ to, subject: "Pago confirmado - Mi Tienda", html: paymentTemplate(orderNumber) });

export const sendOrderCreatedEmail = async ({ to, order }) =>
  sendMail({ to, subject: `Pedido ${order.orderNumber} recibido - Mi Tienda`, html: orderCreatedBuyerTemplate(order) });

export const sendOrderNotificationToSeller = async ({ to, order }) =>
  sendMail({ to, subject: `Nueva orden ${order.orderNumber} - Mi Tienda`, html: orderCreatedSellerTemplate(order) });

export const sendPaymentConfirmedToBuyer = async ({ to, order }) =>
  sendMail({ to, subject: `Pago confirmado - Orden ${order.orderNumber} - Mi Tienda`, html: paymentConfirmedBuyerTemplate(order) });

export const sendPaymentConfirmedToSeller = async ({ to, order }) =>
  sendMail({ to, subject: `Pago verificado - Orden ${order.orderNumber} - Mi Tienda`, html: paymentConfirmedSellerTemplate(order) });

export const sendOrderStatusEmail = async ({ to, orderNumber, status, userName }) =>
  sendMail({ to, subject: `Actualización orden #${orderNumber} - Mi Tienda`, html: orderStatusTemplate(orderNumber, status, userName) });

export const sendPasswordResetEmail = async ({ to, resetUrl }) =>
  sendMail({ to, subject: "Recuperar contraseña - Mi Tienda", html: passwordResetTemplate(resetUrl) });

export const sendPasswordResetSuccessEmail = async ({ to }) =>
  sendMail({ to, subject: "Contraseña actualizada - Mi Tienda", html: passwordResetSuccessTemplate() });

export const sendOrderCancelledTemplate = async ({ to, html }) =>
  sendMail({ to, subject: "Orden cancelada - Mi Tienda", html });

// ============================================================
// EMAIL MARKETING
// ============================================================

export const sendWeMissYouEmail = async ({ to, userName }) =>
  sendMail({ to, subject: "¡Te extrañamos! Vuelve a Mi Tienda 💚", html: weMissYouTemplate(userName) });

export const sendWeeklyOffersEmail = async ({ to, userName, products }) =>
  sendMail({ to, subject: "Ofertas de la semana 🔥 - Mi Tienda", html: weeklyOffersTemplate(userName, products) });

export const sendSeasonalEmail = async ({ to, userName, season }) =>
  sendMail({ to, subject: `¡${season.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} ya está aquí! - Mi Tienda`, html: seasonalTemplate(userName, season) });

export const sendAbandonedCartReminder = async ({ to, cartItems, total }) =>
  sendMail({ to, subject: "¡Tienes productos esperando! 🛒 - Mi Tienda", html: abandonedCartTemplate(cartItems, total) });

export const sendLowStockAlert = async ({ to, sellerName, productTitle, currentStock, productId }) => {
  const html = lowStockTemplate({ sellerName, productTitle, currentStock, productId });
  return sendMail({
    to,
    subject: `⚠️ Stock bajo: ${productTitle}`,
    html,
  });
};

export default {
  sendMail,
  sendVerificationCodeEmail,
  sendProofReceivedEmail,
  sendPaymentConfirmedEmail,
  sendOrderCreatedEmail,
  sendOrderNotificationToSeller,
  sendPaymentConfirmedToBuyer,
  sendPaymentConfirmedToSeller,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendOrderCancelledTemplate,
  sendWeMissYouEmail,
  sendWeeklyOffersEmail,
  sendSeasonalEmail,
  sendLowStockAlert,
};
