const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    // Puedes cambiar este email por el que quieras convertir en admin
    const adminEmail = 'admin@trickest.com';

    console.log(`🔍 Buscando usuario con email: ${adminEmail}`);

    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log(`❌ No se encontró usuario con email: ${adminEmail}`);
      console.log('\n📋 Usuarios disponibles:');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          role: true,
        },
        take: 10,
      });
      allUsers.forEach((u) => {
        console.log(`   - ${u.email} (${u.name || 'Sin nombre'}) - Role: ${u.role}`);
      });
      return;
    }

    console.log(`\n✅ Usuario encontrado:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nombre: ${user.name || 'Sin nombre'}`);
    console.log(`   - Role actual: ${user.role}`);

    if (user.role === 'admin') {
      console.log(`\n⚠️  El usuario ya tiene el rol de admin`);
      return;
    }

    console.log(`\n🔄 Actualizando rol a 'admin'...`);

    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'admin' },
    });

    console.log(`\n✅ ¡Usuario actualizado exitosamente!`);
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Nombre: ${updatedUser.name || 'Sin nombre'}`);
    console.log(`   - Nuevo role: ${updatedUser.role}`);
    console.log(`\n🎮 Ahora puedes acceder al panel de admin en /dashboard/admin`);
    console.log(`   - Gestionar challenges: /dashboard/admin/challenges`);
    console.log(`   - Gestionar usuarios: /dashboard/admin/users`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
