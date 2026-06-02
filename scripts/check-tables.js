const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Conectando a la base de datos...');

    // Intentar hacer una query simple
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    console.log('\n✅ Tablas en la base de datos:');
    console.log('================================');
    result.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('================================\n');

    // Verificar si SpotComment existe
    const spotCommentExists = result.some(row => row.table_name === 'SpotComment');

    if (spotCommentExists) {
      console.log('✅ La tabla SpotComment EXISTE');
    } else {
      console.log('❌ La tabla SpotComment NO EXISTE');
      console.log('⚠️  Necesitas ejecutar: npx prisma db push');
    }

  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:');
    console.error(error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('  1. La base de datos esté en línea');
    console.error('  2. Las variables de entorno estén configuradas correctamente');
    console.error('  3. Tienes conexión a internet');
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
