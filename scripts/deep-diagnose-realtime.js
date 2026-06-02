/**
 * Diagnóstico profundo de Supabase Realtime
 * Prueba diferentes combinaciones para encontrar el problema
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: No se encontraron las variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log('🔍 DIAGNÓSTICO PROFUNDO DE SUPABASE REALTIME');
  console.log('='.repeat(60));

  const testEmail = 'doggy42sb@gmail.com'; // CAMBIAR por tu email

  // Test 1: Suscripción SIN filtro de tabla (escuchar TODO)
  console.log('\n📡 TEST 1: Suscripción sin filtro de tabla...');
  console.log('   Escuchando TODOS los eventos de public schema\n');

  let test1Received = false;
  const test1Channel = supabase
    .channel('test-all-events')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      console.log('✅ TEST 1: Evento recibido!');
      console.log('   Tabla:', payload.table);
      console.log('   Tipo:', payload.eventType);
      test1Received = true;
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ TEST 1: Suscrito a public.*\n');

        // Crear notificación de prueba
        setTimeout(async () => {
          console.log('📝 Creando notificación de prueba...');
          const notification = await prisma.notification.create({
            data: {
              userId: testEmail,
              type: 'TEST_REALTIME_DEEP',
              title: 'Test Deep Diagnostics',
              message: 'Testing if events arrive without table filter',
              link: null,
              isRead: false,
              metadata: { test: true, timestamp: new Date().toISOString() }
            }
          });
          console.log('✅ Notificación creada ID:', notification.id);

          // Esperar 5 segundos
          setTimeout(() => {
            if (test1Received) {
              console.log('\n✅✅✅ TEST 1 EXITOSO!');
              console.log('Los eventos SÍ llegan sin filtro de tabla');
              console.log('PROBLEMA: El filtro de tabla no funciona correctamente');
              console.log('\nSOLUCIÓN: Escuchar sin filtro y filtrar en el cliente');
            } else {
              console.log('\n❌ TEST 1 FALLIDO');
              console.log('Los eventos NO llegan ni sin filtro');
              console.log('PROBLEMA: PostgreSQL no está enviando eventos a Supabase');
              console.log('\nSOLUCIÓN:');
              console.log('1. Ejecutar: ALTER PUBLICATION supabase_realtime REFRESH PUBLICATION;');
              console.log('2. O reiniciar el proyecto de Supabase');
              console.log('3. Contactar a soporte de Supabase');
            }

            // Cleanup y seguir al siguiente test
            prisma.notification.delete({ where: { id: notification.id } });
            supabase.removeChannel(test1Channel);
            runTest2();
          }, 5000);
        }, 2000);
      }
    });

  // Test 2: Diferentes variaciones del nombre de tabla
  function runTest2() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📡 TEST 2: Probando diferentes nombres de tabla...\n');

    const tableNames = [
      'Notification',
      '"Notification"',
      'notifications',
      '"notifications"',
      'notification',
      '"notification"'
    ];

    let currentTest = 0;
    let anySuccess = false;

    function testTableName(tableName) {
      console.log(`   Probando: table: '${tableName}'`);

      let received = false;
      const channel = supabase
        .channel(`test-table-${currentTest}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableName }, (payload) => {
          console.log(`      ✅ EVENTO RECIBIDO con table: '${tableName}'`);
          received = true;
          anySuccess = true;
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setTimeout(async () => {
              const notification = await prisma.notification.create({
                data: {
                  userId: testEmail,
                  type: `TEST_TABLENAME_${currentTest}`,
                  title: `Test ${tableName}`,
                  message: `Testing table name: ${tableName}`,
                  link: null,
                  isRead: false,
                  metadata: { test: true, tableName }
                }
              });

              setTimeout(() => {
                supabase.removeChannel(channel);
                prisma.notification.delete({ where: { id: notification.id } });

                if (received) {
                  console.log(`\n✅✅✅ ENCONTRADO! El nombre correcto es: '${tableName}'`);
                  console.log('ACTUALIZA el código con este nombre de tabla');
                  process.exit(0);
                } else {
                  console.log(`      ❌ No llegó con table: '${tableName}'`);
                  currentTest++;
                  if (currentTest < tableNames.length) {
                    testTableName(tableNames[currentTest]);
                  } else {
                    console.log('\n❌ TEST 2: Ningún nombre de tabla funcionó');
                    if (anySuccess) {
                      console.log('PROBLEMA: El formato del nombre de tabla no es el issue');
                    } else {
                      console.log('PROBLEMA: Los eventos no llegan con NINGÚN filtro de tabla');
                    }
                    process.exit(1);
                  }
                }
              }, 2000);
            }, 500);
          }
        });
    }

    testTableName(tableNames[0]);
  }
}

// Ejecutar diagnósticos
runDiagnostics().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
