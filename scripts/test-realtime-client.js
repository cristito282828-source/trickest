/**
 * Script para probar Supabase Realtime desde Node.js
 * Esto ayuda a aislar si el problema es del cliente (navegador) o del servidor
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: No se encontraron las variables de entorno');
  console.log('Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY están en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtimeSubscription() {
  console.log('🧪 TEST DE SUSCRIPCIÓN REALTIME (Node.js)');
  console.log('='.repeat(50));
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Configurada' : '❌ No configurada');
  console.log('='.repeat(50));

  const testEmail = 'doggy42sb@gmail.com'; // CAMBIAR por tu email

  console.log('\n1️⃣ Creando canal de suscripción...');
  const channelName = `test-notifications-${Date.now()}`;
  console.log('   Nombre del canal:', channelName);

  console.log('\n2️⃣ Suscribiendo a INSERTs en tabla "Notification"...');

  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: testEmail }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: '"Notification"'
      },
      (payload) => {
        console.log('\n✅✅✅ EVENTO RECIBIDO!!!');
        console.log('📊 Payload:', JSON.stringify(payload, null, 2));
        console.log('✅ Realtime está funcionando correctamente');
        console.log('\nSi esto llega desde Node.js, el problema es en el navegador');

        // Cleanup y salir
        setTimeout(() => {
          supabase.removeChannel(channel);
          process.exit(0);
        }, 1000);
      }
    )
    .subscribe((status, err) => {
      console.log('\n📡 Status del canal:', status);

      if (err) {
        console.error('❌ Error en suscripción:', err);
      }

      if (status === 'SUBSCRIBED') {
        console.log('✅ SUSCRITO EXITOSAMENTE');
        console.log('📡 Escuchando INSERTs en "Notification" para userId:', testEmail);
        console.log('\n⏳ Esperando notificaciones...');
        console.log('   (El script seguirá corriendo por 30 segundos)');

        // Después de 3 segundos, crear una notificación de prueba
        setTimeout(async () => {
          console.log('\n3️⃣ Creando notificación de prueba...');

          try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const notification = await prisma.notification.create({
              data: {
                userId: testEmail,
                type: 'REALTIME_NODE_TEST',
                title: '🧪 Test desde Node.js',
                message: 'Test de Realtime desde Node.js',
                link: null,
                isRead: false,
                metadata: {
                  test: true,
                  timestamp: new Date().toISOString()
                }
              }
            });

            console.log('   ✅ Notificación creada ID:', notification.id);
            console.log('   ⏳ Esperando evento WebSocket (max 10 segundos)...');

            // Cleanup después de 10 segundos
            setTimeout(async () => {
              console.log('\n⏱️ Tiempo de espera agotado');
              console.log('❌ No se recibió ningún evento WebSocket');
              console.log('\n❌ DIAGNÓSTICO:');
              console.log('   - La suscripción se creó correctamente');
              console.log('   - El INSERT se ejecutó en la BD');
              console.log('   - PERO el evento NO llegó por WebSocket');
              console.log('\n🔧 PROBLEMA:');
              console.log('   PostgreSQL NO está enviando eventos a Supabase Realtime');
              console.log('\n📝 SOLUCIÓN:');
              console.log('   Ejecuta en el SQL Editor de Supabase:');
              console.log('   ALTER PUBLICATION supabase_realtime DROP TABLE "Notification";');
              console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";');

              await prisma.notification.delete({ where: { id: notification.id } });
              await prisma.$disconnect();

              supabase.removeChannel(channel);
              process.exit(1);
            }, 10000);

          } catch (error) {
            console.error('❌ Error creando notificación:', error);
            process.exit(1);
          }
        }, 3000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en el canal');
        console.error('Error details:', err);
        process.exit(1);
      }
    });

  // Mantener el script corriendo por 30 segundos max
  setTimeout(() => {
    console.log('\n⏱️ Tiempo máximo de espera alcanzado');
    supabase.removeChannel(channel);
    process.exit(0);
  }, 30000);
}

testRealtimeSubscription();
