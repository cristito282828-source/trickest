import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAllToUsername() {
  try {
    console.log('🔄 Iniciando migración completa a usernames...');

    // 1. Migrar SocialMedia
    console.log('📱 Migrando SocialMedia...');
    const socialMedias = await prisma.socialMedia.findMany();
    for (const social of socialMedias) {
      const user = await prisma.user.findUnique({
        where: { email: social.userId },
        select: { username: true }
      });
      if (user?.username) {
        // Crear nuevo registro con username y eliminar el antiguo
        await prisma.socialMedia.create({
          data: {
            userId: user.username,
            facebook: social.facebook,
            instagram: social.instagram,
            tiktok: social.tiktok,
            twitter: social.twitter,
          }
        });
        await prisma.socialMedia.delete({ where: { id: social.id } });
      }
    }

    // 2. Migrar WishSkate
    console.log('🛼 Migrando WishSkate...');
    const wishSkates = await prisma.wishSkate.findMany();
    for (const wish of wishSkates) {
      const user = await prisma.user.findUnique({
        where: { email: wish.userId },
        select: { username: true }
      });
      if (user?.username) {
        await prisma.wishSkate.create({
          data: {
            userId: user.username,
            madero: wish.madero,
            trucks: wish.trucks,
            ruedas: wish.ruedas,
            rodamientos: wish.rodamientos,
            tenis: wish.tenis,
          }
        });
        await prisma.wishSkate.delete({ where: { id: wish.id } });
      }
    }

    // 3. Migrar Teams
    console.log('👥 Migrando Teams...');
    const teams = await prisma.team.findMany();
    for (const team of teams) {
      const owner = await prisma.user.findUnique({
        where: { email: team.ownerId },
        select: { username: true }
      });
      if (owner?.username) {
        await prisma.team.update({
          where: { id: team.id },
          data: { ownerId: owner.username }
        });
      }
    }

    // 4. Migrar Submissions
    console.log('📹 Migrando Submissions...');
    const submissions = await prisma.submission.findMany();
    for (const submission of submissions) {
      const user = await prisma.user.findUnique({
        where: { email: submission.userId },
        select: { username: true }
      });

      let judgeUsername = null;
      if (submission.evaluatedBy) {
        const judge = await prisma.user.findUnique({
          where: { email: submission.evaluatedBy },
          select: { username: true }
        });
        judgeUsername = judge?.username || null;
      }

      if (user?.username) {
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            userId: user.username,
            evaluatedBy: judgeUsername
          }
        });
      }
    }

    // 5. Migrar Votes
    console.log('🗳️ Migrando Votes...');
    const votes = await prisma.vote.findMany();
    for (const vote of votes) {
      const user = await prisma.user.findUnique({
        where: { email: vote.userId },
        select: { username: true }
      });
      if (user?.username) {
        await prisma.vote.update({
          where: { id: vote.id },
          data: { userId: user.username }
        });
      }
    }

    console.log('🎉 Migración completa a usernames finalizada!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateAllToUsername();