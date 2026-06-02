/**
 * Script para verificar el usuario admin ESPECÍFICAMENTE con el hash correcto
 *
 * Este script compara el hash que está en tu BD de producción
 * con el hash que debería tener para "password123"
 *
 * Uso: node scripts/verify-production-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Colores
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Hash correcto para "password123" con bcrypt rounds 10
const CORRECT_HASH = '$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d';

async function verifyProductionUser() {
  console.log('\n' + '='.repeat(70));
  console.log(CYAN + '🔍 VERIFICACIÓN: Usuario Admin en BD de Producción' + RESET);
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Conectar a BD
    console.log(YELLOW + 'Conectando a la base de datos...' + RESET);
    await prisma.$connect();
    console.log(GREEN + '✅ Conectado\n' + RESET);

    // 2. Buscar usuario admin
    console.log(YELLOW + 'Buscando usuario admin@trickest.com...' + RESET);
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@trickest.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        profileStatus: true,
        createdAt: true,
      },
    });

    if (!admin) {
      console.log(RED + '\n❌ PROBLEMA ENCONTRADO: Usuario admin NO EXISTE en la BD' + RESET);
      console.log(YELLOW + '\n🔧 SOLUCIÓN: Ejecuta este comando para crear el usuario:' + RESET);
      console.log(BLUE + '\n   npm run seed\n' + RESET);
      console.log(YELLOW + 'O ejecuta este SQL en Supabase SQL Editor:' + RESET);
      console.log(BLUE + `
INSERT INTO "User" (email, name, password, role, "profileStatus", "createdAt")
VALUES (
  'admin@trickest.com',
  'Admin Trickest',
  '${CORRECT_HASH}',
  'admin',
  'complete',
  NOW()
);
` + RESET);
      process.exit(1);
    }

    console.log(GREEN + '✅ Usuario encontrado\n' + RESET);
    console.log('   📧 Email:', admin.email);
    console.log('   👤 Nombre:', admin.name);
    console.log('   🎭 Role:', admin.role);
    console.log('   📊 Estado:', admin.profileStatus);
    console.log('   📅 Creado:', admin.createdAt);

    // 3. Verificar password
    console.log('\n' + YELLOW + 'Verificando contraseña...' + RESET);

    if (!admin.password) {
      console.log(RED + '\n❌ PROBLEMA ENCONTRADO: Campo password es NULL' + RESET);
      console.log(YELLOW + '\n🔧 SOLUCIÓN: Ejecuta este SQL en Supabase:' + RESET);
      console.log(BLUE + `
UPDATE "User"
SET password = '${CORRECT_HASH}'
WHERE email = 'admin@trickest.com';
` + RESET);
      process.exit(1);
    }

    console.log('   🔑 Hash actual:', admin.password.substring(0, 30) + '...');

    // 4. Comparar hashes
    console.log('\n' + YELLOW + 'Comparando con hash correcto...' + RESET);

    if (admin.password === CORRECT_HASH) {
      console.log(GREEN + '✅ Hash coincide EXACTAMENTE (mismo hash)\n' + RESET);
    } else {
      console.log(YELLOW + '⚠️  Hashes son DIFERENTES (pero pueden ser válidos)\n' + RESET);
      console.log('   Hash esperado:', CORRECT_HASH.substring(0, 30) + '...');
      console.log('   Hash actual:  ', admin.password.substring(0, 30) + '...');
      console.log('\n' + YELLOW + '   Probando con bcrypt.compare()...' + RESET);
    }

    // 5. Probar con bcrypt compare
    const isValid = await bcrypt.compare('password123', admin.password);

    if (isValid) {
      console.log(GREEN + '\n✅ ¡ÉXITO! La contraseña "password123" ES VÁLIDA' + RESET);
      console.log(GREEN + '✅ El usuario admin está correctamente configurado\n' + RESET);
    } else {
      console.log(RED + '\n❌ PROBLEMA ENCONTRADO: La contraseña "password123" NO coincide con el hash' + RESET);
      console.log(YELLOW + '\n🔧 SOLUCIÓN: Actualiza el hash con este SQL en Supabase:' + RESET);
      console.log(BLUE + `
UPDATE "User"
SET password = '${CORRECT_HASH}'
WHERE email = 'admin@trickest.com';
` + RESET);
      console.log(YELLOW + '\nO ejecuta:' + RESET);
      console.log(BLUE + '   npm run seed\n' + RESET);
      process.exit(1);
    }

    // 6. Verificar role
    console.log(YELLOW + 'Verificando role de administrador...' + RESET);
    if (admin.role !== 'admin') {
      console.log(RED + '❌ PROBLEMA ENCONTRADO: Role no es "admin"' + RESET);
      console.log('   Role actual:', admin.role);
      console.log(YELLOW + '\n🔧 SOLUCIÓN: Ejecuta este SQL en Supabase:' + RESET);
      console.log(BLUE + `
UPDATE "User"
SET role = 'admin'
WHERE email = 'admin@trickest.com';
` + RESET);
      process.exit(1);
    }
    console.log(GREEN + '✅ Role correcto: admin\n' + RESET);

    // Resumen final
    console.log('='.repeat(70));
    console.log(GREEN + '✅ VERIFICACIÓN COMPLETA: Todo está bien en la BD' + RESET);
    console.log('='.repeat(70));
    console.log('\n' + CYAN + 'El usuario admin está correctamente configurado en la base de datos.' + RESET);
    console.log(CYAN + '\nSi el login aún falla en producción, el problema NO es la base de datos.' + RESET);
    console.log(CYAN + 'Verifica los logs de producción para ver el error específico.\n' + RESET);

    console.log(YELLOW + '📋 Próximo paso: Ver logs en Vercel' + RESET);
    console.log('   1. Ve a https://vercel.com');
    console.log('   2. Selecciona tu proyecto');
    console.log('   3. Click en "Logs"');
    console.log('   4. Intenta hacer login');
    console.log('   5. Busca líneas con 🔐 [AUTH] o ❌ en los logs\n');

  } catch (error) {
    console.log('\n' + RED + '❌ ERROR:' + RESET);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductionUser()
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
