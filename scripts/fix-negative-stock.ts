// scripts/fix-negative-stock.ts
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

dotenv.config();

const ROOT = path.resolve(process.cwd());

async function findPrismaFile(dir: string): Promise<string | null> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && /^prisma\.(ts|js|mjs)$/.test(e.name)) {
      return full;
    }
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") {
      const found = await findPrismaFile(full);
      if (found) return found;
    }
  }
  return null;
}

async function main() {
  console.log("Buscando lib/prisma en:", ROOT);
  const candidatePaths = [
    path.join(ROOT, "lib"),
    path.join(ROOT, "src", "lib"),
    path.join(ROOT, "dist", "lib"),
    ROOT,
  ];

  let prismaPath: string | null = null;
  for (const base of candidatePaths) {
    try {
      const found = await findPrismaFile(base);
      if (found) {
        prismaPath = found;
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!prismaPath) {
    console.error("No encontré lib/prisma.ts ni lib/prisma.js. Rutas probadas:", candidatePaths);
    process.exit(1);
  }

  console.log("Encontrado prisma en:", prismaPath);

  // Import dinámico usando file URL para evitar problemas de resolución
  const prismaModule = await import(pathToFileURL(prismaPath).href);
  const prisma = prismaModule?.default || prismaModule;

  if (!prisma) {
    console.error("El módulo prisma no exportó nada (default o named). Revisa lib/prisma.");
    process.exit(1);
  }

  console.log("DATABASE_URL presente:", !!process.env.DATABASE_URL);

  try {
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
}

main();
