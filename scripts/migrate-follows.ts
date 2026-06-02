import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateFollowsToUsername() {
  try {
    console.log('🔄 Migrando tabla Follow para usar usernames...');

    // Obtener todos los follows existentes
    const follows = await prisma.follow.findMany();

    for (const follow of follows) {
      // Obtener username del follower
      const followerUser = await prisma.user.findUnique({
        where: { email: follow.followerId },
        select: { username: true }
      });

      // Obtener username del following
      const followingUser = await prisma.user.findUnique({
        where: { email: follow.followingId },
        select: { username: true }
      });

      if (followerUser?.username && followingUser?.username) {
        // Actualizar el follow con usernames
        await prisma.follow.update({
          where: { id: follow.id },
          data: {
            followerId: followerUser.username,
            followingId: followingUser.username
          }
        });
        console.log(`✅ Migrado follow: ${follow.followerId} -> ${followerUser.username}`);
      } else {
        console.log(`⚠️  No se pudo migrar follow ${follow.id} - username faltante`);
      }
    }

    console.log('🎉 Migración de Follow completada!');
  } catch (error) {
    console.error('❌ Error migrando follows:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFollowsToUsername();