const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrphanSubmissions() {
  try {
    console.log('🔍 Verificando submissions y usuarios...\n');

    // Obtener todas las submissions
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    console.log(`📊 Total submissions: ${submissions.length}`);
    console.log('Submissions:', JSON.stringify(submissions, null, 2));
    console.log('\n');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
      },
    });

    console.log(`👥 Total users: ${users.length}`);
    console.log('Users:', JSON.stringify(users, null, 2));
    console.log('\n');

    // Encontrar submissions huérfanas
    const userEmails = new Set(users.map(u => u.email));
    const orphanSubmissions = submissions.filter(s => !userEmails.has(s.userId));

    if (orphanSubmissions.length > 0) {
      console.log('⚠️  SUBMISSIONS HUÉRFANAS ENCONTRADAS:');
      console.log(JSON.stringify(orphanSubmissions, null, 2));
      console.log('\n❌ Estas submissions tienen userId que no existen en la tabla User');
    } else {
      console.log('✅ No hay submissions huérfanas');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrphanSubmissions();
