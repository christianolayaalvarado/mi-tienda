import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear producto
  const newProduct = await prisma.product.create({
    data: {
      title: "Producto de prueba",
      price: 100,
      stock: 10,
      category: {
        create: {
          name: "General"
        }
      }
    }
  })

  console.log("Producto creado:", newProduct)

  // Obtener todos
  const products = await prisma.product.findMany()
  console.log("Productos:", products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())