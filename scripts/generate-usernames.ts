import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUsernames() {
  try {
    console.log('🔄 Generando usernames únicos para usuarios existentes...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    for (const user of users) {
      if (!user.username) {
        // Generar username basado en el nombre o email
        let baseUsername = '';

        if (user.name) {
          // Limpiar el nombre: quitar espacios, caracteres especiales, convertir a lowercase
          baseUsername = user.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
        } else {
          // Usar parte del email antes del @
          baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        // Asegurar que tenga al menos 3 caracteres
        if (baseUsername.length < 3) {
          baseUsername = baseUsername + 'skater';
        }

        // Generar username único
        let username = baseUsername;
        let counter = 1;

        while (true) {
          const existingUser = await prisma.user.findUnique({
            where: { username },
          });

          if (!existingUser) {
            break;
          }

          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Actualizar el usuario con el username generado
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });

        console.log(`✅ Usuario ${user.email} -> @${username}`);
      }
    }

    console.log('🎉 Todos los usernames han sido generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateUsernames();