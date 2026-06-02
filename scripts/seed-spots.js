/**
 * Script para agregar spots de ejemplo (skateparks y skateshops) en Colombia
 *
 * Uso: node scripts/seed-spots.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Spots de ejemplo en diferentes ciudades de Colombia
const spotsData = [
  // Bogotá
  {
    name: 'Skatepark Alcalá',
    type: 'skatepark',
    description: 'Skatepark público en Alcalá, zona norte de Bogotá. Cuenta con bowl, rampas y street plaza.',
    address: 'Calle 127 # 70A - 95',
    city: 'Bogotá',
    state: 'Cundinamarca',
    latitude: 4.7126,
    longitude: -74.0698,
    features: ['bowl', 'street', 'rampas'],
    instagram: 'skateparkalcala',
    isVerified: true,
    rating: 4.5,
  },
  {
    name: 'Tory Skateshop',
    type: 'skateshop',
    description: 'La mejor skateshop de Colombia. Tablas, trucks, ruedas y todo lo que necesitas para patinar.',
    address: 'Calle 93 # 13 - 24',
    city: 'Bogotá',
    state: 'Cundinamarca',
    latitude: 4.6764,
    longitude: -74.0485,
    phone: '+57 1 234 5678',
    website: 'https://toryskateshop.com',
    instagram: 'toryskateshop',
    isVerified: true,
    rating: 5.0,
  },
  {
    name: 'Skatepark Simón Bolívar',
    type: 'skatepark',
    description: 'Uno de los skateparks más grandes de Bogotá, ubicado en el parque Simón Bolívar.',
    address: 'Parque Metropolitano Simón Bolívar',
    city: 'Bogotá',
    state: 'Cundinamarca',
    latitude: 4.6570,
    longitude: -74.0922,
    features: ['bowl', 'vert', 'street', 'mini-ramp'],
    isVerified: true,
    rating: 4.8,
  },

  // Medellín
  {
    name: 'Skatepark Pies Descalzos',
    type: 'skatepark',
    description: 'Skatepark icónico en el centro de Medellín, uno de los primeros de la ciudad.',
    address: 'Carrera 58 # 42 - 125',
    city: 'Medellín',
    state: 'Antioquia',
    latitude: 6.2476,
    longitude: -75.5658,
    features: ['street', 'rampas'],
    isVerified: true,
    rating: 4.3,
  },
  {
    name: 'Element Skateshop Medellín',
    type: 'skateshop',
    description: 'Tienda oficial de Element y otras marcas reconocidas de skateboarding.',
    address: 'Calle 10 # 43F - 55',
    city: 'Medellín',
    state: 'Antioquia',
    latitude: 6.2094,
    longitude: -75.5707,
    phone: '+57 4 321 6789',
    instagram: 'elementmedellin',
    isVerified: true,
    rating: 4.7,
  },

  // Cali
  {
    name: 'Skatepark Imbanaco',
    type: 'skatepark',
    description: 'Skatepark moderno en el oeste de Cali con excelentes instalaciones.',
    address: 'Carrera 100 # 11 - 60',
    city: 'Cali',
    state: 'Valle del Cauca',
    latitude: 3.3958,
    longitude: -76.5432,
    features: ['bowl', 'street'],
    isVerified: false,
    rating: 4.0,
  },
  {
    name: 'Vans Skateshop Cali',
    type: 'skateshop',
    description: 'Tienda oficial de Vans con productos de skate y moda urbana.',
    address: 'Calle 5 # 38A - 20',
    city: 'Cali',
    state: 'Valle del Cauca',
    latitude: 3.4372,
    longitude: -76.5225,
    phone: '+57 2 444 5566',
    website: 'https://vans.com.co',
    instagram: 'vanscolombia',
    isVerified: true,
    rating: 4.6,
  },

  // Barranquilla
  {
    name: 'Skatepark Parque Venezuela',
    type: 'skatepark',
    description: 'Skatepark público en el norte de Barranquilla.',
    address: 'Calle 87 # 52 - 50',
    city: 'Barranquilla',
    state: 'Atlántico',
    latitude: 10.9878,
    longitude: -74.8034,
    features: ['street', 'rampas'],
    isVerified: false,
    rating: 3.8,
  },

  // Cartagena
  {
    name: 'Skateshop Cartagena Skate',
    type: 'skateshop',
    description: 'Tienda local de skate en Cartagena con productos importados y nacionales.',
    address: 'Centro Histórico, Calle de la Mantilla # 3 - 56',
    city: 'Cartagena',
    state: 'Bolívar',
    latitude: 10.4236,
    longitude: -75.5443,
    phone: '+57 5 665 4321',
    instagram: 'cartagenaskate',
    isVerified: false,
    rating: 4.2,
  },

  // Bucaramanga
  {
    name: 'Skatepark Parque del Agua',
    type: 'skatepark',
    description: 'Skatepark con vista espectacular en el Parque del Agua de Bucaramanga.',
    address: 'Parque del Agua, Calle 56',
    city: 'Bucaramanga',
    state: 'Santander',
    latitude: 7.1193,
    longitude: -73.1228,
    features: ['bowl', 'street'],
    isVerified: false,
    rating: 4.1,
  },
];

async function seedSpots() {
  console.log('🚀 Iniciando seed de spots...\n');

  try {
    // Buscar el usuario admin para usar como createdBy
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@trickest.com' },
    });

    if (!admin) {
      console.error('❌ No se encontró el usuario admin@trickest.com');
      console.log('⚠️  Ejecuta primero: npm run seed\n');
      process.exit(1);
    }

    console.log(`✅ Usuario admin encontrado: ${admin.email}\n`);

    // Crear cada spot
    let created = 0;
    let skipped = 0;

    for (const spotData of spotsData) {
      try {
        // Verificar si ya existe un spot con el mismo nombre
        const existing = await prisma.spot.findFirst({
          where: {
            name: spotData.name,
            city: spotData.city,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping: ${spotData.name} (ya existe)`);
          skipped++;
          continue;
        }

        const spot = await prisma.spot.create({
          data: {
            ...spotData,
            createdBy: admin.email,
          },
        });

        created++;
        console.log(`✅ Creado: ${spot.name} (${spot.city}) - ${spot.type}`);
      } catch (error) {
        console.error(`❌ Error creando ${spotData.name}:`, error.message);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Spots creados: ${created}`);
    console.log(`   ⏭️  Spots omitidos: ${skipped}`);
    console.log(`   📍 Total en la BD: ${created + skipped}`);

    console.log(`\n🎉 ¡Seed completado exitosamente!`);
    console.log(`\n📍 Puedes ver el mapa en: http://localhost:3000/spots\n`);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSpots();
