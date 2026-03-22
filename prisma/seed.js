import { PrismaClient } from '@prisma/client'
import { products } from '../src/data/products.js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // 🔐 Crear usuario admin
  const password = await bcrypt.hash("123456", 10)
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Admin",
      password,
    },
  })

  console.log("Usuario admin creado:", admin.email)


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
        categoryId: category.id,
        userId: admin.id, // <-- importante, asignar al usuario
        seller: product.seller || "",
        sellerCode: product.sellerCode || "",
        store: product.store || "",
        storeCode: product.storeCode || "",
        description: product.description || "",
        images: product.images || [],
      }
    })
  }

  console.log("Productos importados correctamente 🚀")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())