/**
 * Script para diagnosticar problemas con Supabase Realtime
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Diagnosticando Supabase Realtime...\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...\n');

async function testRealtime() {
  try {
    // Crear un canal de prueba
    console.log('1️⃣ Creando canal de prueba...');
    const channel = supabase
      .channel('test-diagnosis', {
        config: {
          broadcast: { self: true },
          presence: { key: 'test-user' }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Notification'
      }, (payload) => {
        console.log('✅ Evento recibido:', payload);
      })
      .subscribe((status, err) => {
        console.log(`📡 Status: ${status}`);
        if (err) {
          console.error('❌ Error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción exitosa');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en el canal');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Timeout en la suscripción');
        }
      });

    // Esperar un poco
    console.log('⏳ Esperando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar estado del canal
    console.log('2️⃣ Estado del canal:', channel.state);

    // Remover canal
    console.log('3️⃣ Removiendo canal...');
    supabase.removeChannel(channel);
    console.log('✅ Canal removido');

    console.log('\n✨ Diagnóstico completado');
    console.log('\n💡 Si ves "SUBSCRIBED", Realtime está funcionando');
    console.log('💡 Si ves "CHANNEL_ERROR" o "TIMED_OUT", hay problemas con Supabase Realtime');
    console.log('\n📋 Posibles problemas:');
    console.log('   1. Realtime no está habilitado en Supabase');
    console.log('   2. La tabla "Notification" no tiene replicación habilitada');
    console.log('   3. Problemas de red o firewall');
    console.log('   4. Configuración incorrecta de RLS (Row Level Security)');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

testRealtime().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
