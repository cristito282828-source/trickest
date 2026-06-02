const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpotPhotos() {
  try {
    const spots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
        photos: true,
        type: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n📸 Fotos de los spots más recientes:\n');

    spots.forEach((spot, index) => {
      console.log(`${index + 1}. ${spot.name} (${spot.type})`);
      console.log(`   ID: ${spot.id}`);
      if (spot.photos && spot.photos.length > 0) {
        console.log(`   Fotos: ${spot.photos.length}`);
        spot.photos.forEach((photo, i) => {
          console.log(`      ${i + 1}. ${photo}`);
        });
      } else {
        console.log(`   Fotos: Ninguna`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error al consultar spots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpotPhotos();
