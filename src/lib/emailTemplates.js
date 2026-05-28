export const baseTemplate = (content) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;">
      
      <!-- HEADER -->
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;">
        <h1>Tu Tienda</h1>
      </div>

      <!-- CONTENT -->
      <div style="padding:20px;color:#333;">
        ${content}
      </div>

      <!-- FOOTER -->
      <div style="background:#fafafa;padding:15px;text-align:center;font-size:12px;color:#777;">
        © ${new Date().getFullYear()} Tu Tienda
      </div>

    </div>
  </div>
  `;
};

// 📩 comprobante recibido
export const proofTemplate = (orderId) =>
  baseTemplate(`
    <h2>Comprobante recibido 📄</h2>
    <p>Hemos recibido tu comprobante para la orden:</p>
    <p><strong>#${orderId}</strong></p>
    <p>Estamos verificando el pago.</p>
  `);

// ✅ pago confirmado
export const paymentTemplate = (orderId) =>
  baseTemplate(`
    <h2>Pago confirmado ✅</h2>
    <p>Tu orden <strong>#${orderId}</strong> ha sido confirmada.</p>
    <p>Gracias por tu compra.</p>
  `);