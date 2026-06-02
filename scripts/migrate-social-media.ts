import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSocialMediaToUsername() {
  try {
    console.log('🔄 Migrando tabla SocialMedia para usar usernames...');

    const socialMedias = await prisma.socialMedia.findMany();

    for (const social of socialMedias) {
      const user = await prisma.user.findUnique({
        where: { email: social.userId },
        select: { username: true }
      });

      if (user?.username) {
        await prisma.socialMedia.update({
          where: { id: social.id },
          data: { userId: user.username }
        });
        console.log(`✅ Migrado SocialMedia: ${social.userId} -> ${user.username}`);
      }
    }

    console.log('🎉 Migración de SocialMedia completada!');
  } catch (error) {
    console.error('❌ Error migrando SocialMedia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSocialMediaToUsername();