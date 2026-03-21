import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET → listar productos
export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true }
  })

  return Response.json(products)
}

// POST → crear producto
export async function POST(req) {
  const body = await req.json()

  const product = await prisma.product.create({
    data: {
      title: body.title,
      price: body.price,
      stock: body.stock,
      category: {
        connect: {
          id: body.categoryId
        }
      }
    }
  })

  return Response.json(product)
}