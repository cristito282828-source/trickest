const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding settings...');

  // Crear o actualizar el setting de total_levels
  const totalLevelsSetting = await prisma.appSettings.upsert({
    where: { key: 'total_levels' },
    update: {},
    create: {
      key: 'total_levels',
      value: '8',
      description: 'Total de niveles en el sistema (incluye regulares + bonus)',
      updatedBy: null,
    },
  });

  console.log('✅ Setting creado:', totalLevelsSetting);
  console.log('🎮 Total de niveles configurado: 8');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
