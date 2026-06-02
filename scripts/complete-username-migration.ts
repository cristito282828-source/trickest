import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeUsernameMigration() {
  try {
    console.log('🔄 Iniciando migración completa a usernames...');

    // Desactivar foreign key checks temporalmente (esto es conceptual, Prisma no lo soporta directamente)
    // En PostgreSQL podemos hacer esto directamente con SQL

    // 1. Migrar SocialMedia
    console.log('📱 Migrando SocialMedia...');
    const socialMedias = await prisma.$queryRaw`SELECT * FROM "SocialMedia"`;
    for (const social of socialMedias as any[]) {
      const user = await prisma.user.findUnique({
        where: { email: social.userId },
        select: { username: true }
      });
      if (user?.username) {
        await prisma.$executeRaw`
          UPDATE "SocialMedia" SET "userId" = ${user.username} WHERE id = ${social.id}
        `;
      }
    }

    // 2. Migrar WishSkate
    console.log('🛼 Migrando WishSkate...');
    const wishSkates = await prisma.$queryRaw`SELECT * FROM "WishSkate"`;
    for (const wish of wishSkates as any[]) {
      const user = await prisma.user.findUnique({
        where: { email: wish.userId },
        select: { username: true }
      });
      if (user?.username) {
        await prisma.$executeRaw`
          UPDATE "WishSkate" SET "userId" = ${user.username} WHERE id = ${wish.id}
        `;
      }
    }

    // 3. Migrar Teams
    console.log('👥 Migrando Teams...');
    const teams = await prisma.$queryRaw`SELECT * FROM "Team"`;
    for (const team of teams as any[]) {
      const owner = await prisma.user.findUnique({
        where: { email: team.ownerId },
        select: { username: true }
      });
      if (owner?.username) {
        await prisma.$executeRaw`
          UPDATE "Team" SET "ownerId" = ${owner.username} WHERE id = ${team.id}
        `;
      }
    }

    // 4. Migrar Submissions
    console.log('📹 Migrando Submissions...');
    const submissions = await prisma.$queryRaw`SELECT * FROM "Submission"`;
    for (const submission of submissions as any[]) {
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
        await prisma.$executeRaw`
          UPDATE "Submission"
          SET "userId" = ${user.username}, "evaluatedBy" = ${judgeUsername}
          WHERE id = ${submission.id}
        `;
      }
    }

    // 5. Migrar Votes
    console.log('🗳️ Migrando Votes...');
    const votes = await prisma.$queryRaw`SELECT * FROM "Vote"`;
    for (const vote of votes as any[]) {
      const user = await prisma.user.findUnique({
        where: { email: vote.userId },
        select: { username: true }
      });
      if (user?.username) {
        await prisma.$executeRaw`
          UPDATE "Vote" SET "userId" = ${user.username} WHERE id = ${vote.id}
        `;
      }
    }

    console.log('🎉 Migración completa a usernames finalizada!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeUsernameMigration();