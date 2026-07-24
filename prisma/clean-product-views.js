import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete all fictitious ProductView records
    const result = await prisma.productView.deleteMany({});
    console.log(`✅ Eliminados ${result.count} registros ficticios de ProductView`);
  } catch (error) {
    console.error("Error limpiando ProductView:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
