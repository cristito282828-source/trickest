const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpotPhotoRecords() {
  try {
    const photoRecords = await prisma.spotPhoto.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        spot: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    console.log('\n📸 Registros de SpotPhoto:\n');

    if (photoRecords.length === 0) {
      console.log('❌ No hay registros en SpotPhoto');
    } else {
      photoRecords.forEach((record, index) => {
        console.log(`${index + 1}. Spot: ${record.spot.name}`);
        console.log(`   URL: ${record.url}`);
        console.log(`   Usuario: ${record.userId}`);
        console.log(`   Live: ${record.isLive}`);
        console.log(`   Creado: ${record.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpotPhotoRecords();
