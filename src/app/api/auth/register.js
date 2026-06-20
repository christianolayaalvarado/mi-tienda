// src/pages/api/auth/register.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationCodeEmail } from "@/lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido" });
  }

  try {
    await dbConnect();

    const { name, email, password, storeName, provider = "gmail" } = req.body;

    // 1️⃣ Crear usuario en MongoDB
    const user = await User.create({
      name,
      email,
      password,
      storeName,
      emailVerified: false,
    });

    // 2️⃣ Generar código de verificación
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar código en el usuario (puedes usar un campo verificationCode)
    user.verificationCode = code;
    await user.save();

    // 3️⃣ Intentar enviar correo
    try {
      await sendVerificationCodeEmail({ to: email, code, provider });
      return res.status(200).json({ ok: true, message: "Usuario creado y correo enviado" });
    } catch (err) {
      console.error("Error enviando correo:", err);
      // Usuario ya está creado, pero correo falló
      return res.status(200).json({ ok: true, message: "Usuario creado, pero error enviando correo" });
    }

  } catch (err) {
    console.error("Error registrando usuario:", err);
    return res.status(500).json({ ok: false, message: "Error registrando usuario" });
  }
}
