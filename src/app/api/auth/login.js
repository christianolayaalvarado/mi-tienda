// src/pages/api/auth/login.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs"; // asegúrate de tener bcryptjs instalado
import jwt from "jsonwebtoken"; // opcional si quieres emitir un token

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido" });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    // 1️⃣ Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    // 2️⃣ Validar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ ok: false, message: "Contraseña incorrecta" });
    }

    // 3️⃣ Verificar si la cuenta está confirmada
    if (!user.emailVerified) {
      return res.status(403).json({ ok: false, message: "Cuenta no verificada", user });
    }

    // 4️⃣ Opcional: generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      ok: true,
      message: "Login exitoso",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        emailVerified: user.emailVerified,
      },
      token,
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
}
