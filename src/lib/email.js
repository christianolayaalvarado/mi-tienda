import nodemailer from "nodemailer";
import { proofTemplate, paymentTemplate } from "./emailTemplates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📩 comprobante recibido
export const sendProofReceivedEmail = async ({ to, orderId }) => {
  await transporter.sendMail({
    from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Comprobante recibido",
    html: proofTemplate(orderId),
  });
};

// ✅ pago confirmado
export const sendPaymentConfirmedEmail = async ({ to, orderId }) => {
  await transporter.sendMail({
    from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Pago confirmado",
    html: paymentTemplate(orderId),
  });
};