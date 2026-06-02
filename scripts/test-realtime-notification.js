/**
 * Script para probar si Supabase Realtime está funcionando
 *
 * Uso:
 * 1. Abre la app con el usuario: doggy42sb@gmail.com
 * 2. Deja la consola del navegador abierta
 * 3. Ejecuta: node scripts/test-realtime-notification.js
 * 4. Deberías ver el evento en la consola del navegador
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealtimeNotification() {
  try {
    const userEmail = 'doggy42sb@gmail.com'; // CAMBIAR por tu email de prueba

    console.log('🧪 Creando notificación de prueba para:', userEmail);
    console.log('📱 Abre la app con este usuario y mira la consola...');

    // Esperar 3 segundos para dar tiempo a abrir la consola
    await new Promise(resolve => setTimeout(resolve, 3000));

    const notification = await prisma.notification.create({
      data: {
        userId: userEmail,
        type: 'TEST_REALTIME',
        title: '🧪 Test de Realtime',
        message: 'Si ves esto, ¡Realtime está funcionando!',
        link: null,
        isRead: false,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log('✅ Notificación creada en BD:', notification.id);
    console.log('🔍 Revisa la consola del navegador - deberías ver el evento');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeNotification();
