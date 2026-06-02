/**
 * Script para verificar si RLS está activado en la tabla Notification
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRLS() {
  try {
    console.log('🔍 Verificando RLS en tabla Notification...\n');

    // Verificar si RLS está activado
    const rlsEnabled = await prisma.$queryRaw`
      SELECT relname AS table_name, relrowsecurity AS rls_enabled
      FROM pg_class
      WHERE relname = 'Notification';
    `;

    if (rlsEnabled.length > 0) {
      const isEnabled = rlsEnabled[0].rls_enabled;
      console.log('Estado de RLS:', isEnabled ? '🔒 ACTIVADO' : '🔓 DESACTIVADO');

      if (isEnabled) {
        console.log('\n❌ PROBLEMA ENCONTRADO:');
        console.log('   RLS está ACTIVADO pero NO hay policies');
        console.log('   Esto significa que PostgreSQL bloquea TODOS los inserts/updates/selects');
        console.log('   incluidos los eventos de Realtime para clientes anónimos\n');

        console.log('🔧 SOLUCIÓN 1 (Recomendada): Crear policies para permitir acceso\n');
        console.log('-- Policy para que los usuarios puedan ver sus propias notificaciones:');
        console.log('CREATE POLICY "Users can view own notifications"');
        console.log('ON "Notification"');
        console.log('FOR SELECT');
        console.log('USING (userId = auth.jwt()->>"email");\n');

        console.log('-- Policy para permitir inserts (para el sistema):');
        console.log('CREATE POLICY "Allow inserts"');
        console.log('ON "Notification"');
        console.log('FOR INSERT');
        console.log('WITH CHECK (true);\n');

        console.log('🔧 SOLUCIÓN 2 (Más rápida): Desactivar RLS en esta tabla\n');
        console.log('ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;\n');

        console.log('⚠️ NOTA: Solución 2 es más simple pero menos segura.');
        console.log('   Solución 1 es más segura pero requiere configurar policies bien.');
      }
    } else {
      console.log('❌ No se pudo determinar el estado de RLS');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRLS();
