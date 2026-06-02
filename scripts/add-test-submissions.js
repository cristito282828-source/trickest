const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Obtener username del argumento de línea de comandos
  const targetUsername = process.argv[2];

  console.log('📊 Creando submissions de prueba...\n');

  let users = [];

  if (targetUsername) {
    // Si se especificó un username, buscar ese usuario específico
    console.log(`🎯 Buscando usuario: ${targetUsername}\n`);
    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { username: true, name: true, email: true, role: true }
    });

    if (!user) {
      console.error(`❌ No se encontró el usuario con username: ${targetUsername}`);
      console.log('\n💡 Usuarios disponibles:');
      const allUsers = await prisma.user.findMany({
        select: { username: true, name: true, email: true }
      });
      allUsers.forEach(u => {
        console.log(`   - @${u.username} (${u.name}) - ${u.email}`);
      });
      return;
    }

    users = [user];
    console.log(`✅ Usuario encontrado: ${user.name} (@${user.username}) - ${user.email}\n`);
  } else {
    // Si no se especificó, usar los primeros 5 skaters
    console.log('🛹 Buscando skaters de prueba...\n');
    users = await prisma.user.findMany({
      where: { role: 'skater' },
      take: 5,
      select: { username: true, name: true, email: true }
    });

    if (users.length === 0) {
      console.error('❌ No se encontraron usuarios tipo "skater"');
      return;
    }

    console.log(`✅ Encontrados ${users.length} skaters\n`);
  }

  const challenges = await prisma.challenge.findMany({
    where: { isBonus: false },
    take: 5,
    orderBy: { level: 'asc' },
    select: { id: true, name: true, level: true }
  });

  if (challenges.length === 0) {
    console.error('❌ No se encontraron challenges. Ejecuta el seed primero: npm run seed');
    return;
  }

  // URLs de videos de ejemplo de YouTube (skateboarding tricks)
  const videoUrls = [
    'https://www.youtube.com/watch?v=339ZL9Z7uGk', // Ollie tutorial
    'https://www.youtube.com/watch?v=GkXXQT1Z5U8', // Kickflip
    'https://www.youtube.com/watch?v=G-R50KqYy1I', // Pop Shove-it
    'https://www.youtube.com/watch?v=DJGbSwWTp1Y', // Heelflip
    'https://www.youtube.com/watch?v=8B8K_VGCrzk'  // Varial Kickflip
  ];

  const submissions = [];

  // Si es un usuario específico, crear 5 submissions para ese usuario
  // Si son múltiples usuarios, crear 1 submission por usuario
  const submissionsPerUser = targetUsername ? 5 : 1;

  for (const user of users) {
    for (let i = 0; i < Math.min(submissionsPerUser, challenges.length); i++) {
      const challenge = challenges[i];
      const videoUrl = videoUrls[i];

      try {
        // Verificar si ya existe una submission para este challenge
        const existing = await prisma.submission.findFirst({
          where: {
            userId: user.email,
            challengeId: challenge.id
          }
        });

        if (existing) {
          console.log(`⚠️  ${user.name} ya tiene una submission para ${challenge.name} - omitiendo`);
          continue;
        }

        const submission = await prisma.submission.create({
          data: {
            userId: user.email,
            challengeId: challenge.id,
            videoUrl: videoUrl,
            status: 'pending',
            submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          },
          include: {
            user: { select: { name: true, email: true } },
            challenge: { select: { name: true, level: true } }
          }
        });

        submissions.push(submission);
        console.log(`✅ Submission creada:`);
        console.log(`   👤 Usuario: ${submission.user.name} (${submission.user.email})`);
        console.log(`   🎯 Challenge: ${submission.challenge.name} (Nivel ${submission.challenge.level})`);
        console.log(`   📹 Video: ${submission.videoUrl}`);
        console.log(`   📅 Enviado: ${submission.submittedAt.toLocaleDateString()}\n`);
      } catch (error) {
        console.error(`❌ Error creando submission para ${user.email}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 Total de submissions creadas: ${submissions.length}`);

  if (targetUsername) {
    console.log(`\n💡 Tip: Inicia sesión con el usuario @${targetUsername} para ver las submissions en:`);
    console.log('   /dashboard/skaters/submissions');
  } else {
    console.log('\n💡 Tips:');
    console.log('   - Accede al dashboard de jueces para evaluar estas submissions');
    console.log('   - Para crear submissions para un usuario específico:');
    console.log('     node scripts/add-test-submissions.js <username>');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
