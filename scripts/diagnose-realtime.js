/**
 * Script para diagnosticar problemas de Supabase Realtime
 *
 * Este script:
 * 1. Verifica que la tabla Notification existe
 * 2. Verifica que está en la publicación supabase_realtime
 * 3. Crea una notificación de prueba
 * 4. Te da instrucciones para verificar si llega el evento
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseRealtime() {
  try {
    console.log('🔍 DIAGNÓSTICO DE SUPABASE REALTIME');
    console.log('='.repeat(50));

    // 1. Verificar que la tabla existe
    console.log('\n1️⃣ Verificando tabla Notification...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Notification'
      );
    `;
    console.log('   Tabla Notification existe:', tableExists[0].exists ? '✅ Sí' : '❌ No');

    if (!tableExists[0].exists) {
      console.log('   ❌ La tabla no existe. Esto es un problema de schema.');
      return;
    }

    // 2. Verificar publicación
    console.log('\n2️⃣ Verificando publicación supabase_realtime...');
    const publication = await prisma.$queryRaw`
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
    `;

    if (publication.length === 0) {
      console.log('   ❌ La publicación supabase_realtime no tiene tablas');
      console.log('   ❌ PROBLEMA ENCONTRADO: La tabla Notification NO está en la publicación');
      console.log('\n   SOLUCIÓN: Ejecuta este SQL en tu dashboard de Supabase:');
      console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";');
    } else {
      console.log('   Tablas en publicación:');
      publication.forEach(pub => {
        console.log(`   - ${pub.schemaname}.${pub.tablename}`);
      });

      const notificationTable = pub => pub.tablename === 'Notification';
      if (publication.some(notificationTable)) {
        console.log('   ✅ Tabla Notification está en la publicación');
      } else {
        console.log('   ❌ PROBLEMA: Tabla Notification NO está en la publicación');
        console.log('\n   SOLUCIÓN: Ejecuta este SQL:');
        console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";');
      }
    }

    // 3. Verificar RLS policies
    console.log('\n3️⃣ Verificando RLS policies...');
    const policies = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'Notification';
    `;

    if (policies.length === 0) {
      console.log('   ⚠️ No hay policies RLS (puede ser un problema si RLS está activado)');
    } else {
      console.log('   Policies RLS encontradas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
        console.log(`     Roles: ${policy.roles}`);
        console.log(`     Comandos: ${policy.cmd}`);
      });
    }

    // 4. Crear notificación de prueba
    console.log('\n4️⃣ Creando notificación de prueba...');
    const testEmail = 'doggy42sb@gmail.com'; // CAMBIAR por tu email

    const notification = await prisma.notification.create({
      data: {
        userId: testEmail,
        type: 'REALTIME_TEST',
        title: '🧪 Test de Realtime',
        message: 'Si ves esto instantáneamente, ¡Realtime funciona!',
        link: null,
        isRead: false,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log('   ✅ Notificación creada en BD:', notification.id);
    console.log('   ✅ INSERT ejecutado en PostgreSQL');

    // 5. Instrucciones para probar
    console.log('\n' + '='.repeat(50));
    console.log('📋 INSTRUCCIONES PARA PROBAR:');
    console.log('='.repeat(50));
    console.log('1. Abre la app con el usuario:', testEmail);
    console.log('2. Abre la consola del navegador (F12)');
    console.log('3. Deja la consola visible');
    console.log('4. Espera ver: "🔔🔔🔔 EVENTO POSTGRES RECIBIDO!"');
    console.log('\nSi NO ves el evento en 5 segundos, entonces:');
    console.log('❌ El problema es que PostgreSQL NO está enviando eventos por WebSocket');
    console.log('\nSOLUCIÓN: Ejecuta en el SQL Editor de Supabase:');
    console.log('ALTER PUBLICATION supabase_realtime DROP TABLE "Notification";');
    console.log('ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";');
    console.log('\nO verifica si necesitas reiniciar el proyecto de Supabase.');

    console.log('\nLimpieza: Borrando notificación de prueba...');
    await prisma.notification.delete({
      where: { id: notification.id }
    });
    console.log('✅ Notificación de prueba borrada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseRealtime();
