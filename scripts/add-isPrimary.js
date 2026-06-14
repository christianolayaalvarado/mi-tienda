// scripts/add-isPrimary.js  (ESM)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Añadiendo isPrimary: false a todos los paymentMethods...");
  await prisma.paymentMethod.updateMany({
    where: {},
    data: { isPrimary: false },
  });
  console.log("Hecho.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
