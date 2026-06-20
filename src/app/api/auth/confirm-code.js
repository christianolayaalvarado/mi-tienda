// src/pages/api/auth/confirm-code.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido" });
  }

  try {
    await dbConnect();

    const { email, code } = req.body;

    // 1️⃣ Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    // 2️⃣ Validar código
    if (user.verificationCode !== code) {
      return res.status(400).json({ ok: false, message: "Código inválido" });
    }

    // 3️⃣ Marcar como verificado
    user.emailVerified = true;
    user.verificationCode = undefined; // opcional: limpiar el código
    await user.save();

    return res.status(200).json({ ok: true, message: "Cuenta verificada correctamente" });

  } catch (err) {
    console.error("Error confirmando código:", err);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
}
