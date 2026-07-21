// src/lib/emailTemplates.js

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
  } catch {
    return `S/ ${Number(value || 0).toFixed(2)}`;
  }
}

/** Base wrapper con header + footer profesional */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);padding:28px 32px;text-align:center;">
            <img src="${appUrl}/images/logo-white.png" alt="Mi Tienda" style="height:48px;width:auto;display:block;margin:0 auto 8px;" />
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;">Tu plataforma de compras y ventas</p>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:32px;color:#333333;font-size:15px;line-height:1.7;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8faf9;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} Mi Tienda &mdash; Todos los derechos reservados
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
              Este es un correo automático, por favor no respondas directamente.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

/** Botón CTA reutilizable */
function ctaButton(text, url) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);border-radius:8px;">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/** Tabla de items de orden */
function buildOrderItemsHtml(items = []) {
  if (!items || items.length === 0) return "<p style='color:#9ca3af;'>No hay productos.</p>";
  let rows = items.map(
    (it) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">${it.productName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;">${it.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-weight:600;">${formatCurrency(it.price)}</td>
      </tr>`
  ).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="text-align:left;padding:10px 12px;font-size:13px;color:#6b7280;font-weight:600;">Producto</th>
          <th style="text-align:center;padding:10px 12px;font-size:13px;color:#6b7280;font-weight:600;">Cant.</th>
          <th style="text-align:right;padding:10px 12px;font-size:13px;color:#6b7280;font-weight:600;">Precio</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/** Badge de estado */
function statusBadge(text, color) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:#fff;background:${color};">${text}</span>`;
}

// ============================================================
// TEMPLATES EXPORTADOS
// ============================================================

/** Verificación de código */
export const verificationCodeTemplate = (code) => {
  const ttlMinutes = Math.floor(Number(process.env.VERIFICATION_TTL_SECONDS || 900) / 60);
  return baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Verifica tu correo electrónico</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Hola, gracias por registrarte en <strong>Mi Tienda</strong>.</p>
    <p style="margin:0 0 8px;color:#374151;">Tu código de verificación es:</p>

    <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
      <span style="font-size:32px;font-weight:800;color:#16a34a;letter-spacing:6px;">${code}</span>
    </div>

    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Este código expira en <strong>${ttlMinutes} minutos</strong>.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Si no solicitaste este código, puedes ignorar este correo.</p>
  `);
};

/** Comprobante recibido */
export const proofTemplate = (orderNumber) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">📄 Comprobante recibido</h2>
    <p style="margin:0 0 8px;color:#6b7280;">Hemos recibido tu comprobante de pago para la orden:</p>

    <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#92400e;font-size:16px;">#${orderNumber}</strong>
    </div>

    <p style="margin:0 0 8px;color:#374151;">Nuestro equipo está verificando el pago. Te notificaremos cuando sea confirmado.</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Puedes revisar el estado de tu orden en tu panel de compras.</p>
  `);

/** Pago confirmado */
export const paymentTemplate = (orderNumber) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">✅ Pago confirmado</h2>
    <p style="margin:0 0 8px;color:#6b7280;">¡Buenas noticias! El pago de tu orden ha sido verificado.</p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#166534;font-size:16px;">#${orderNumber}</strong>
      ${statusBadge("Pago confirmado", "#16a34a")}
    </div>

    <p style="margin:0 0 8px;color:#374151;">El vendedor preparará tu pedido para el envío.</p>
    ${ctaButton("Ver mi orden", `${appUrl}/dashboard/purchases`)}
  `);

/** Orden creada - al comprador */
export const orderCreatedBuyerTemplate = (order) =>
  baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🎉 Pedido recibido</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${order.userName || "cliente"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Hemos recibido tu pedido correctamente.</p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#166534;">Orden: ${order.orderNumber}</strong>
    </div>

    ${buildOrderItemsHtml(order.items)}

    <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb;margin-top:8px;">
      <span style="font-size:13px;color:#6b7280;">Total:</span>
      <strong style="font-size:20px;color:#111827;margin-left:8px;">${formatCurrency(order.total)}</strong>
    </div>

    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#1e40af;font-weight:600;">Siguiente paso: realizar el pago</p>
      <p style="margin:0;color:#3b82f6;font-size:13px;">Sube tu comprobante de pago desde tu panel de compras para que el vendedor pueda verificar y preparar tu envío.</p>
    </div>

    ${ctaButton("Subir comprobante de pago", `${appUrl}/dashboard/purchases`)}
  `);

/** Orden creada - al vendedor */
export const orderCreatedSellerTemplate = (order) =>
  baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">📦 Nueva orden recibida</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${order.sellerName || "vendedor"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Se ha creado una nueva orden que incluye productos de tu tienda.</p>

    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#1e40af;">Orden: ${order.orderNumber}</strong>
      ${statusBadge("Pendiente de pago", "#f59e0b")}
    </div>

    ${buildOrderItemsHtml(order.items)}

    <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb;margin-top:8px;">
      <span style="font-size:13px;color:#6b7280;">Total de tu tienda:</span>
      <strong style="font-size:20px;color:#111827;margin-left:8px;">${formatCurrency(order.total)}</strong>
    </div>

    <div style="background:#fefce8;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 4px;color:#a16207;font-weight:600;">Esperando pago del comprador</p>
      <p style="margin:0;color:#ca8a04;font-size:13px;">Una vez que el comprador suba su comprobante, podrás verificar y confirmar el pago.</p>
    </div>

    ${ctaButton("Ver orden en tu panel", `${appUrl}/dashboard/seller/orders`)}
  `);

/** Pago confirmado - al comprador */
export const paymentConfirmedBuyerTemplate = (order) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">✅ Pago confirmado</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${order.userName || "cliente"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Tu pago ha sido verificado y confirmado por el vendedor.</p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#166534;font-size:16px;">Orden: ${order.orderNumber}</strong>
      ${statusBadge("Pago confirmado", "#16a34a")}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:12px;background:#f9fafb;border-radius:8px;">
          <p style="margin:0;color:#6b7280;font-size:13px;">Monto pagado</p>
          <p style="margin:4px 0 0;color:#111827;font-size:22px;font-weight:700;">${formatCurrency(order.total)}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;color:#374151;">El vendedor preparará tu pedido para el envío. Recibirás una notificación cuando sea enviado.</p>

    ${ctaButton("Ver mi orden", `${appUrl}/dashboard/purchases`)}
  `);

/** Pago confirmado - al vendedor */
export const paymentConfirmedSellerTemplate = (order) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">💰 Pago confirmado</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${order.sellerName || "vendedor"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Has confirmado el pago exitosamente.</p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#166534;font-size:16px;">Orden: ${order.orderNumber}</strong>
      ${statusBadge("Pago verificado", "#16a34a")}
    </div>

    ${buildOrderItemsHtml(order.items)}

    <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb;margin-top:8px;">
      <span style="font-size:13px;color:#6b7280;">Total confirmado:</span>
      <strong style="font-size:20px;color:#111827;margin-left:8px;">${formatCurrency(order.total)}</strong>
    </div>

    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#166534;font-weight:600;">Ahora puedes preparar el envío del pedido.</p>
    </div>

    ${ctaButton("Gestionar orden", `${appUrl}/dashboard/seller/orders`)}
  `);

/** Recuperación de contraseña */
export const passwordResetTemplate = (resetUrl) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">🔑 Recuperar contraseña</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Recibimos una solicitud para restablecer tu contraseña.</p>

    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:13px;">Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá igual.</p>
    </div>

    ${ctaButton("Restablecer contraseña", resetUrl)}

    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Este enlace expira en 1 hora por seguridad.</p>
  `);

/** Orden cancelada - al comprador */
export const orderCancelledBuyerTemplate = (data) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">❌ Orden cancelada</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${data.userName || "cliente"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Tu orden ha sido cancelada por el vendedor.</p>

    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#991b1b;font-size:16px;">#${data.orderNumber}</strong>
      ${statusBadge("Cancelado", "#ef4444")}
    </div>

    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#374151;font-weight:600;">Motivo de cancelación:</p>
      <p style="margin:0;color:#6b7280;">${data.reason}</p>
    </div>

    ${buildOrderItemsHtml(data.items)}

    <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb;margin-top:8px;">
      <span style="font-size:13px;color:#6b7280;">Total:</span>
      <strong style="font-size:20px;color:#111827;margin-left:8px;">${formatCurrency(data.total)}</strong>
    </div>

    ${data.hasPayment ? `
      <div style="background:#fefce8;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;color:#a16207;font-weight:600;">Pago registrado</p>
        <p style="margin:0;color:#ca8a04;font-size:13px;">
          Se ha registrado un pago para esta orden. El proceso de reembolso está pendiente de gestión por parte del equipo de soporte.
          Te notificaremos cuando se complete el reembolso.
        </p>
      </div>
    ` : ""}

    ${ctaButton("Ver mis órdenes", `${appUrl}/dashboard/purchases`)}
  `);

/** Orden cancelada - al vendedor */
export const orderCancelledSellerTemplate = (data) =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">❌ Orden cancelada</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${data.sellerName || "vendedor"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">Una orden que incluye productos de tu tienda ha sido cancelada.</p>

    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:#991b1b;font-size:16px;">#${data.orderNumber}</strong>
      ${statusBadge("Cancelado", "#ef4444")}
    </div>

    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#374151;font-weight:600;">Motivo de cancelación:</p>
      <p style="margin:0;color:#6b7280;">${data.reason}</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Cliente: ${data.buyerName}</p>
    </div>

    ${buildOrderItemsHtml(data.items)}

    <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb;margin-top:8px;">
      <span style="font-size:13px;color:#6b7280;">Total:</span>
      <strong style="font-size:20px;color:#111827;margin-left:8px;">${formatCurrency(data.total)}</strong>
    </div>

    ${data.hasPayment ? `
      <div style="background:#fefce8;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;color:#a16207;font-weight:600;">Pago registrado</p>
        <p style="margin:0;color:#ca8a04;font-size:13px;">
          Esta orden tenía un pago registrado. El proceso de reembolso está pendiente.
        </p>
      </div>
    ` : ""}

    ${ctaButton("Gestionar órdenes", `${appUrl}/dashboard/seller/orders`)}
  `);

/** Reset password exitoso */
export const passwordResetSuccessTemplate = () =>
  baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">✅ Contraseña actualizada</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Tu contraseña ha sido cambiada exitosamente.</p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <p style="margin:0;color:#166534;">Ahora puedes iniciar sesión con tu nueva contraseña.</p>
    </div>

    ${ctaButton("Iniciar sesión", `${appUrl}/login`)}
  `);

/** Estado de orden genérico */
export const orderStatusTemplate = (orderNumber, status, userName) => {
  const statusConfig = {
    pending: { text: "Pendiente de pago", color: "#f59e0b", bg: "#fffbeb", border: "#f59e0b" },
    paid: { text: "Pago confirmado", color: "#16a34a", bg: "#f0fdf4", border: "#16a34a" },
    processing: { text: "En preparación", color: "#3b82f6", bg: "#eff6ff", border: "#3b82f6" },
    shipped: { text: "Enviado", color: "#8b5cf6", bg: "#f5f3ff", border: "#8b5cf6" },
    delivered: { text: "Entregado", color: "#16a34a", bg: "#f0fdf4", border: "#16a34a" },
    cancelled: { text: "Cancelado", color: "#ef4444", bg: "#fef2f2", border: "#ef4444" },
  };
  const s = statusConfig[status] || { text: status, color: "#6b7280", bg: "#f9fafb", border: "#d1d5db" };

  return baseTemplate(`
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">📦 Actualización de tu pedido</h2>
    <p style="margin:0 0 4px;color:#6b7280;">Hola <strong>${userName || "cliente"}</strong>,</p>
    <p style="margin:0 0 16px;color:#6b7280;">El estado de tu pedido ha cambiado:</p>

    <div style="background:${s.bg};border-left:4px solid ${s.border};padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <strong style="color:${s.color};font-size:16px;">#${orderNumber}</strong>
      ${statusBadge(s.text, s.color)}
    </div>

    ${ctaButton("Ver mi orden", `${appUrl}/dashboard/purchases`)}
  `);
};

// ============================================================
// EMAIL MARKETING TEMPLATES
// ============================================================

export const weMissYouTemplate = (userName) => baseTemplate(`
  <h2 style="margin:0 0 8px;font-size:22px;color:#16a34a;">¡Te extrañamos, ${userName || "amigo"}! 💚</h2>
  <p style="margin:0 0 16px;color:#555;">
    Hace tiempo que no nos visitas. Tu tienda favorita tiene novedades que no te puedes perder.
  </p>

  <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin:16px 0;">
    <h3 style="margin:0 0 12px;font-size:16px;color:#166534;">Lo que te perdiste:</h3>
    <ul style="margin:0;padding-left:20px;color:#555;">
      <li style="margin-bottom:6px;">Nuevos productos agregados esta semana</li>
      <li style="margin-bottom:6px;">Ofertas especiales solo para ti</li>
      <li style="margin-bottom:6px;">Tu mascota extraña tus visitas 🐾</li>
    </ul>
  </div>

  ${ctaButton("Volver a la tienda", appUrl)}
`);

export const weeklyOffersTemplate = (userName, products) => {
  const productRows = (products || []).slice(0, 4).map(p => `
    <div style="display:inline-block;width:48%;vertical-align:top;margin:1%;background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.title}" style="width:100%;height:120px;object-fit:cover;" />` : `<div style="width:100%;height:120px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Sin imagen</div>`}
      <div style="padding:10px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title}</p>
        <p style="margin:0;color:#16a34a;font-weight:bold;font-size:15px;">${formatCurrency(p.price)}</p>
        ${p.originalPrice ? `<p style="margin:2px 0 0;font-size:11px;color:#999;text-decoration:line-through;">${formatCurrency(p.originalPrice)}</p>` : ""}
      </div>
    </div>
  `).join("");

  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#16a34a;">Ofertas de la semana 🔥</h2>
    <p style="margin:0 0 16px;color:#555;">
      ${userName ? `Hola ${userName},` : "Hola,"} seleccionamos estas ofertas imperdibles para ti.
    </p>

    <div style="margin:20px 0;">
      ${productRows}
    </div>

    ${ctaButton("Ver todas las ofertas", `${appUrl}/?sort=price-asc`)}
  `);
};

export const seasonalTemplate = (userName, season) => {
  const themes = {
    "black-friday": { emoji: "🖤", title: "Black Friday", color: "#000000", bg: "#1a1a1a", textColor: "#ffffff" },
    "navidad": { emoji: "🎄", title: "Navidad", color: "#dc2626", bg: "#fef2f2", textColor: "#991b1b" },
    "verano": { emoji: "☀️", title: "Ofertas de Verano", color: "#f59e0b", bg: "#fffbeb", textColor: "#92400e" },
    "san-valentin": { emoji: "💕", title: "San Valentín", color: "#ec4899", bg: "#fdf2f8", textColor: "#9d174d" },
    "dia-madre": { emoji: "💐", title: "Día de la Madre", color: "#a855f7", bg: "#faf5ff", textColor: "#6b21a8" },
    "cyber-monday": { emoji: "💻", title: "Cyber Monday", color: "#2563eb", bg: "#eff6ff", textColor: "#1e40af" },
    "inicio-ano": { emoji: "🎉", title: "Inicio de Año", color: "#16a34a", bg: "#f0fdf4", textColor: "#166534" },
  };

  const t = themes[season] || themes["inicio-ano"];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
    <body style="margin:0;padding:0;background:${t.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${t.bg};padding:24px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${t.color};padding:32px;text-align:center;">
                <p style="font-size:48px;margin:0;">${t.emoji}</p>
                <h1 style="margin:12px 0 4px;font-size:28px;color:${t.textColor};">${t.title}</h1>
                <p style="margin:0;color:${t.textColor};opacity:0.9;font-size:14px;">¡No te quedes sin estas ofertas!</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#333;font-size:15px;line-height:1.7;">
                <h2 style="margin:0 0 12px;font-size:20px;">Hola ${userName || ""},</h2>
                <p style="margin:0 0 16px;">
                  Preparamos ofertas especiales por <strong>${t.title}</strong>. 
                  Es el momento perfecto para encontrar lo que buscas a precios increíbles.
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${appUrl}" style="display:inline-block;background:${t.color};color:${t.textColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                    Ver ofertas ${t.title}
                  </a>
                </div>
                <p style="margin:16px 0 0;color:#888;font-size:13px;text-align:center;">
                  Ofertas por tiempo limitado. ¡No te lo pierdas!
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8faf9;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#999;font-size:12px;">© ${new Date().getFullYear()} Mi Tienda. Todos los derechos reservados.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
};

export const abandonedCartTemplate = (cartItems, total) => {
  const itemsHtml = cartItems
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td width="60" style="padding-right:12px;"><img src="${item.image}" alt="${item.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" /></td>` : ""}
              <td>
                <p style="margin:0;font-weight:600;color:#1f2937;font-size:14px;">${item.name}</p>
                <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Cantidad: ${item.quantity} × ${formatCurrency(item.price)}</p>
              </td>
              <td style="text-align:right;font-weight:600;color:#16a34a;white-space:nowrap;">${formatCurrency(item.price * item.quantity)}</td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return baseTemplate(`
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">¡Tienes productos esperando! 🛒</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">No olvides completar tu compra. Estos productos siguen disponibles por poco tiempo.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${itemsHtml}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:16px;background:#f0fdf4;border-radius:8px;">
                  <p style="margin:0;font-size:16px;font-weight:700;color:#16a34a;">Total: ${formatCurrency(total)}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/cart" style="display:inline-block;padding:14px 32px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">Completar mi compra</a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">¿No fue tu carrito? Puedes ignorar este mensaje.</p>
          </td>
        </tr>
  `);
};

export const reviewRequestTemplate = ({ buyerName, orderId, orderNumber }) => {
  const reviewUrl = `${appUrl}/dashboard/orders/${orderId}`;
  return `
        <tr>
          <td align="center" style="padding:0 16px">
            <div style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 32px;text-align:center;font-family:'Inter','Segoe UI',sans-serif">
              <div style="font-size:48px;margin-bottom:16px">⭐</div>
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937">¿Cómo te fue con tu compra?</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Tu opinión ayuda a otros compradores</p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px">
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px">Orden</p>
                <p style="margin:0;font-size:17px;font-weight:600;color:#1f2937">#${orderNumber}</p>
              </div>

              <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Tu compra fue entregada. ¿Podrías calificar tu experiencia y dejar una reseña? Toma solo 30 segundos.</p>

              <a href="${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:8px;font-size:15px">Dejar reseña</a>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center">Gracias por confiar en Mi Tienda</p>
            </div>
          </td>
        </tr>
  `;
};

export const lowStockTemplate = ({ sellerName, productTitle, currentStock, productId }) => {
  const productUrl = `${appUrl}/dashboard/products`;
  const stockColor = currentStock <= 1 ? "#dc2626" : currentStock <= 2 ? "#f59e0b" : "#2563eb";
  const stockLabel = currentStock <= 1 ? "CRÍTICO" : "BAJO";
  return `
        <tr>
          <td align="center" style="padding:0 16px">
            <div style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 32px;text-align:center;font-family:'Inter','Segoe UI',sans-serif">
              <div style="font-size:48px;margin-bottom:16px">⚠️</div>
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937">Alerta de Stock ${stockLabel}</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Tu producto se está agotando</p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px">
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px">Producto</p>
                <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#1f2937">${productTitle}</p>
                <div style="font-size:36px;font-weight:800;color:${stockColor};margin:0 0 4px">${currentStock}</div>
                <p style="margin:0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px">unidades restantes</p>
              </div>

              <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Reabastece tu inventario pronto para no perder ventas.</p>

              <a href="${productUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:8px;font-size:15px">Reabastecer ahora</a>
            </div>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center">Mi Tienda — Notificación de inventario</p>
          </td>
        </tr>
  `;
};

export default {
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
  weMissYouTemplate,
  weeklyOffersTemplate,
  seasonalTemplate,
  abandonedCartTemplate,
  lowStockTemplate,
};
