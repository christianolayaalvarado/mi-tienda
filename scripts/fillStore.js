import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Encuentra todos los usuarios sin store
  const usersWithoutStore = await prisma.user.findMany({
    where: { store: null }
  });

  console.log('Usuarios sin store:', usersWithoutStore.length);

  // Actualiza cada usuario
  for (const user of usersWithoutStore) {
    await prisma.user.update({
      where: { id: user.id },
      data: { store: 'DecorHome Store' } // Aquí puedes poner el nombre correcto
    });
    console.log(`Actualizado user ${user.name} con store DecorHome Store`);
  }

  console.log('Todos los usuarios actualizados ✅');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });