import QRCode from "qrcode";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const amount = searchParams.get("amount");
  const phone = "51959502168";

  if (!amount) {
    return new Response("Falta monto", { status: 400 });
  }

  const yapeUrl = `yape://pay?phone=${phone}&amount=${amount}`;

  try {
    const qr = await QRCode.toDataURL(yapeUrl);

    return Response.json({ qr });
  } catch (err) {
    return new Response("Error generando QR", { status: 500 });
  }
}