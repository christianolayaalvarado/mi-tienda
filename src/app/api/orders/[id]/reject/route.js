import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

// 🔹 validar ObjectId
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id)
}

export async function POST(req, context) {
  try {
    // ✅ Next 15 fix
    const { params } = await context
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

    // 🔹 validar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
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

    // 🔥 obtener archivo
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Archivo inválido" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir comprobante a Uploadthing
    const { utapi } = await import("uploadthing/server")
    const uploadFile = new File([buffer], `comprobante_rechazo_${orderId}.jpg`, { type: file.type || "image/jpeg" })
    const uploadResult = await utapi.uploadFiles([uploadFile])

    const proofUrl = uploadResult?.[0]?.data?.url

    // Actualizar orden
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: proofUrl,
        paymentStatus: "pending_verification",
      },
    })

    // 🔥 actualizar sub-órdenes
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: {
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