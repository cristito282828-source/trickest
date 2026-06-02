const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'SpotComment'
      ORDER BY ordinal_position
    `;
    console.log('Columnas en SpotComment:');
    result.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
