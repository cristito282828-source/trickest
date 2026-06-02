const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkComment() {
  try {
    console.log('🔍 Buscando comentario 39...\n');

    // Buscar comentario específico
    const comment = await prisma.spotComment.findUnique({
      where: { id: 39 },
      include: {
        user: {
          select: { name: true, email: true }
        },
        parentComment: {
          select: { id: true, content: true }
        }
      }
    });

    if (comment) {
      console.log('✅ COMENTARIO 39 ENCONTRADO:');
      console.log('ID:', comment.id);
      console.log('Spot ID:', comment.spotId);
      console.log('Usuario:', comment.user.name, `(${comment.user.email})`);
      console.log('Contenido:', comment.content);
      console.log('Es respuesta?:', comment.parentCommentId ? `Sí (del comentario ${comment.parentCommentId})` : 'No');
      console.log('Likes:', comment.likes);
      console.log('Creado:', comment.createdAt);
      console.log('Oculto?:', comment.isHidden);
    } else {
      console.log('❌ El comentario 39 NO existe en la base de datos');
    }

    // Buscar todos los comentarios del spot 21
    console.log('\n📋 Todos los comentarios del spot 21:');
    const allComments = await prisma.spotComment.findMany({
      where: { spotId: 21 },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Total: ${allComments.length} comentarios\n`);

    allComments.forEach(c => {
      const type = c.parentCommentId ? `└─ Respuesta a ${c.parentCommentId}` : '● Comentario principal';
      console.log(`  ID ${c.id}: ${type}`);
      console.log(`     ${c.user.name}: "${c.content.substring(0, 50)}..."`);
      console.log(`     Likes: ${c.likes} | Oculto: ${c.isHidden ? 'Sí' : 'No'}\n`);
    });

    // Buscar si hay comentarios alrededor del 39 (por si fue eliminado)
    console.log('\n🔍 Comentarios alrededor del ID 39:');
    const nearbyComments = await prisma.spotComment.findMany({
      where: {
        id: { gte: 35, lte: 45 }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Encontrados: ${nearbyComments.length} comentarios`);
    nearbyComments.forEach(c => {
      console.log(`  ID ${c.id}: Spot ${c.spotId} ${c.parentCommentId ? '(respuesta)' : '(principal)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkComment();
