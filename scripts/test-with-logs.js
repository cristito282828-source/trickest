/**
 * Script para probar Supabase Realtime con LOGS DETALLADOS
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: No se encontraron las variables de entorno');
  process.exit(1);
}

// Habilitar logs de debug de Supabase Realtime
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  global: {
    headers: { 'x-debug-realtime': 'true' }
  }
});

const testEmail = 'doggy42sb@gmail.com'; // CAMBIAR por tu email

async function testWithLogs() {
  console.log('🧪 TEST DE SUPABASE REALTIME CON LOGS');
  console.log('='.repeat(60));

  const channel = supabase
    .channel('test-with-logs', {
      config: {
        broadcast: { self: true },
        presence: { key: testEmail }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, (payload) => {
      console.log('\n✅✅✅ EVENTO RECIBIDO!!!');
      console.log('Tipo:', payload.eventType);
      console.log('Tabla:', payload.table);
      console.log('Payload:', JSON.stringify(payload, null, 2));
    })
    .subscribe((status, err) => {
      console.log('\n📡 Status:', status);
      if (err) console.error('Error:', err);

      if (status === 'SUBSCRIBED') {
        console.log('✅ Suscrito. Esperando eventos...');
        console.log('Abre el navegador y prueba crear una notificación');
        console.log('Este script se mantendrá ejecutándose por 60 segundos\n');

        // Crear notificación de prueba después de 3 segundos
        setTimeout(async () => {
          console.log('\n📝 Creando notificación de prueba desde este script...');
          try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const notification = await prisma.notification.create({
              data: {
                userId: testEmail,
                type: 'TEST_WITH_LOGS',
                title: '🧪 Test con Logs',
                message: 'Testing with detailed logs enabled',
                link: null,
                isRead: false,
                metadata: { test: true, timestamp: new Date().toISOString() }
              }
            });

            console.log('✅ Notificación creada ID:', notification.id);
            console.log('⏳ Esperando evento... (10 segundos max)\n');

            setTimeout(async () => {
              console.log('\n⏱️ Tiempo agotado');
              await prisma.notification.delete({ where: { id: notification.id } });
              await prisma.$disconnect();
              supabase.removeChannel(channel);
              process.exit(0);
            }, 10000);

          } catch (error) {
            console.error('❌ Error:', error);
            process.exit(1);
          }
        }, 3000);
      }
    });

  // Mantener vivo por 60 segundos max
  setTimeout(() => {
    console.log('\n⏱️ Tiempo máximo alcanzado');
    supabase.removeChannel(channel);
    process.exit(0);
  }, 60000);
}

testWithLogs();
