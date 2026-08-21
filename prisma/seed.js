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
      // Asegurar que el role sea admin y plan full
      const updateData = {};
      if (existingAdmin.role !== "admin" && existingAdmin.role !== "ADMIN") {
        updateData.role = "admin";
      }
      if (existingAdmin.plan !== "full") {
        updateData.plan = "full";
      }
      if (!existingAdmin.emailVerified) {
        updateData.emailVerified = true;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { email: "admin@demo.com" },
          data: updateData,
        });
        console.log("Admin actualizado:", updateData);
      }
    } else {
      const password = await bcrypt.hash("123456", 10);
      const admin = await prisma.user.create({
        data: {
          email: "admin@demo.com",
          name: "Admin",
          password,
          role: "admin",
          plan: "full",
          emailVerified: true,
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

    // 🧹 NO borrar productos existentes — solo crear los que falten
    // (Eliminado deleteMany para preservar productos creados por usuarios)

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

      // Verificar si el producto ya existe por título
      const existingProduct = await prisma.product.findFirst({
        where: { title: product.title },
      });

      if (existingProduct) {
        console.log(`Producto ya existe: ${product.title}`);
        continue;
      }

      // 🚀 Crear producto
      const discountPct = product.discountPct || (product.id % 3 === 0 ? [15, 20, 25, 30, 40][product.id % 5] : null);
      const originalPrice = discountPct ? Math.round((product.price ?? 0) / (1 - discountPct / 100)) : null;

      await prisma.product.create({
        data: {
          title: product.title,
          price: product.price ?? 0,
          originalPrice,
          discountPct,
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