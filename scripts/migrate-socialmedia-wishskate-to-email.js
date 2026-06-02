const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToEmail() {
  try {
    console.log('🔄 Migrando SocialMedia y WishSkate a email...\n');

    // 1. Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: { email: true, username: true },
    });
    console.log(`👥 Encontrados ${users.length} usuarios`);

    // Crear mapa username -> email
    const usernameToEmail = new Map();
    users.forEach(u => {
      if (u.username) {
        usernameToEmail.set(u.username, u.email);
      }
    });

    // 2. Actualizar SocialMedia
    const socialMediaRecords = await prisma.$queryRaw`SELECT * FROM "SocialMedia"`;
    console.log(`\n📱 SocialMedia records: ${socialMediaRecords.length}`);

    for (const sm of socialMediaRecords) {
      console.log(`  - userId actual: ${sm.userId}`);
      const newEmail = usernameToEmail.get(sm.userId);
      if (newEmail) {
        console.log(`    ✅ Actualizando a: ${newEmail}`);
        await prisma.$executeRaw`UPDATE "SocialMedia" SET "userId" = ${newEmail} WHERE id = ${sm.id}`;
      } else {
        console.log(`    ⚠️  No se encontró email para username: ${sm.userId}`);
      }
    }

    // 3. Actualizar WishSkate
    const wishSkateRecords = await prisma.$queryRaw`SELECT * FROM "WishSkate"`;
    console.log(`\n🛹 WishSkate records: ${wishSkateRecords.length}`);

    for (const ws of wishSkateRecords) {
      console.log(`  - userId actual: ${ws.userId}`);
      const newEmail = usernameToEmail.get(ws.userId);
      if (newEmail) {
        console.log(`    ✅ Actualizando a: ${newEmail}`);
        await prisma.$executeRaw`UPDATE "WishSkate" SET "userId" = ${newEmail} WHERE id = ${ws.id}`;
      } else {
        console.log(`    ⚠️  No se encontró email para username: ${ws.userId}`);
      }
    }

    console.log('\n✅ Migración completada!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToEmail();
