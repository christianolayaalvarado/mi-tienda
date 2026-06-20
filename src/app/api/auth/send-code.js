// src/pages/api/auth/send-code.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationCodeEmail } from "@/lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido" });
  }

  try {
    await dbConnect();

    const { email, provider = "gmail" } = req.body;

    // 1️⃣ Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    // 2️⃣ Generar nuevo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    await user.save();

    // 3️⃣ Intentar enviar correo
    try {
      await sendVerificationCodeEmail({ to: email, code, provider });
      return res.status(200).json({ ok: true, message: "Correo de verificación reenviado" });
    } catch (err) {
      console.error("Error reenviando correo:", err);
      return res.status(200).json({ ok: true, message: "Código generado, pero error enviando correo" });
    }

  } catch (err) {
    console.error("Error en send-code:", err);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
}
