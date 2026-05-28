import { PrismaClient } from '@prisma/client';
import { products } from '../src/data/products.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // 🔐 Revisar si el usuario admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@demo.com" },
    });

    let adminId;
    if (existingAdmin) {
      console.log("Usuario admin ya existe:", existingAdmin.email);
      adminId = existingAdmin.id;
    } else {
      const password = await bcrypt.hash("123456", 10);
      const admin = await prisma.user.create({
        data: {
          email: "admin@demo.com",
          name: "Admin",
          password,
        },
      });
      console.log("Usuario admin creado:", admin.email);
      adminId = admin.id;
    }

    // 🏪 Crear la tienda asociada al admin si no existe
    let store = await prisma.store.findFirst({
      where: { userId: adminId },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: "DecorHome Store",
          code: "ADMIN001",
          userId: adminId,
        },
      });
      console.log("Tienda creada para admin:", store.name);
    } else {
      console.log("Tienda del admin ya existe:", store.name);
    }

    // 🧹 Limpiar productos existentes
    await prisma.product.deleteMany();

    for (const product of products) {
      // 🔎 Crear o buscar categoría
      let category = await prisma.category.findFirst({
        where: { name: product.category },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: product.category },
        });
      }

      // 🖼 Validar imágenes
      const images =
        product.images && product.images.length > 0
          ? product.images.filter((img) => img && img.trim() !== "")
          : ["/images/placeholder.png"];

      // 🚀 Crear producto
      await prisma.product.create({
        data: {
          title: product.title,
          price: product.price ?? 0,
          stock: product.stock ?? 0,
          categoryId: category.id,
          storeId: store.id,
          userId: adminId,
          description: product.description ?? "",
          images,
        },
      });
    }

    console.log("Productos importados correctamente 🚀");
  } catch (error) {
    console.error("Error en seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();