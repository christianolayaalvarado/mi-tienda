// scripts/fix-negative-stock.cjs
const prisma = require("../lib/prisma").default || require("../lib/prisma");
(async () => {
  try {
    console.log("Conectando a la DB...");
    const res = await prisma.product.updateMany({
      where: { stock: { lt: 0 } },
      data: { stock: 0 },
    });
    console.log("Productos actualizados:", res);
    process.exit(0);
  } catch (err) {
    console.error("Error corrigiendo stocks negativos:", err);
    process.exit(1);
  }
})();
