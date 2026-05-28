import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import cloudinary from "@/lib/cloudinary"

// 🔹 validar ObjectId
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id)
}

export async function POST(req, context) {
  try {
    // ✅ FIX REAL Next 15
    const params = await context.params
    const orderId = params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // 🔍 validar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      )
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // 📦 obtener archivo
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Archivo inválido" },
        { status: 400 }
      )
    }

    // 🔄 convertir a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ☁️ subir a Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "payment_proofs" },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(buffer)
    })

    // 💾 guardar comprobante
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: uploadResult.secure_url,
        paymentStatus: "pending_verification",
      },
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
    })

  } catch (error) {
    console.error("🔥 ERROR UPLOAD PROOF:", error)

    return NextResponse.json(
      { error: "Error subiendo comprobante" },
      { status: 500 }
    )
  }
}