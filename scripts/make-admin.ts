import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = 'pipmon123@gmail.com'; // Cambia esto por tu email si es diferente

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log('✅ Usuario actualizado a admin:');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🎖️ Role:', user.role);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
