import { PrismaClient } from '@prisma/client'
import { products } from '../src/data/products.js'

const prisma = new PrismaClient()

async function main() {
  for (const product of products) {
    // Primero crear o buscar categoría
    let category = await prisma.category.findFirst({
      where: { name: product.category }
    })

    if (!category) {
      category = await prisma.category.create({
        data: { name: product.category }
      })
    }

    // Crear producto
    await prisma.product.create({
      data: {
        title: product.title,
        price: product.price,
        stock: product.stock || 0,
        categoryId: category.id
      }
    })
  }

  console.log("Productos importados correctamente 🚀")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())