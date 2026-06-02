const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('📋 Últimas 10 notificaciones en la base de datos:');
  console.log('═'.repeat(80));
  notifications.forEach(n => {
    console.log(`ID: ${n.id}`);
    console.log(`Tipo: ${n.type}`);
    console.log(`User: ${n.userId}`);
    console.log(`Título: ${n.title}`);
    console.log(`Mensaje: ${n.message}`);
    console.log(`Leída: ${n.isRead ? 'Sí' : 'No'}`);
    console.log(`Creado: ${n.createdAt}`);
    console.log('─'.repeat(40));
  });

  const count = await prisma.notification.count();
  console.log(`\n📊 Total de notificaciones en la BD: ${count}`);

  await prisma.$disconnect();
}

checkNotifications().catch(console.error);
