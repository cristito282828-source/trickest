const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpots() {
  try {
    const spots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        stage: true,
        latitude: true,
        longitude: true,
        city: true,
        confidenceScore: true,
      }
    });

    console.log(`\n📍 Total de spots encontrados: ${spots.length}\n`);

    if (spots.length > 0) {
      console.log('Spots registrados:');
      spots.forEach((spot, index) => {
        console.log(`${index + 1}. ${spot.name} (${spot.type})`);
        console.log(`   ID: ${spot.id}`);
        console.log(`   Stage: ${spot.stage}`);
        console.log(`   Score: ${spot.confidenceScore}`);
        console.log(`   Ubicación: ${spot.latitude}, ${spot.longitude}`);
        console.log(`   Ciudad: ${spot.city || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No hay spots registrados en la base de datos');
    }

  } catch (error) {
    console.error('Error al consultar spots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpots();
