// Test simple de conexión a la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Iniciando test de conexión a DB...');

  try {
    console.log('1. Conectando a la base de datos...');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');

    console.log('2. Obteniendo challenges...');
    const challenges = await prisma.challenge.findMany({
      orderBy: [
        { isBonus: 'asc' },
        { level: 'asc' },
      ],
    });

    console.log(`✅ SUCCESS: ${challenges.length} challenges obtenidos`);
    console.log('   Ejemplo:', challenges[0]);

    console.log('3. Obteniendo usuarios...');
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`✅ SUCCESS: ${users.length} usuarios obtenidos`);
    console.log('   Ejemplo:', users[0]);

    console.log('\n✅ TODAS LAS TESTS PASARON - La conexión a DB está bien');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack);

    if (error.code === 'P1001') {
      console.error('\n🔴 PROBLEMA: No se puede conectar al servidor de base de datos');
      console.error('   Solución: Verifica que Supabase esté activo');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
