/**
 * Script para probar autenticación con credenciales (simulando NextAuth)
 *
 * Este script simula exactamente lo que hace NextAuth cuando intentas
 * hacer login con email/password en producción.
 *
 * Uso: node scripts/test-credentials-auth.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Colores
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Credenciales a probar
const TEST_CREDENTIALS = {
  email: 'admin@trickest.com',
  password: 'password123'
};

async function testCredentialsAuth() {
  console.log('\n' + '='.repeat(70));
  console.log(CYAN + '🔐 TEST: AUTENTICACIÓN CON CREDENCIALES' + RESET);
  console.log('='.repeat(70) + '\n');

  console.log(YELLOW + 'Simulando login con:' + RESET);
  console.log(`   Email: ${TEST_CREDENTIALS.email}`);
  console.log(`   Password: ${TEST_CREDENTIALS.password}\n`);

  try {
    // Paso 1: Validar que las credenciales no estén vacías
    console.log(YELLOW + '1️⃣  Validando credenciales...' + RESET);
    if (!TEST_CREDENTIALS.email || !TEST_CREDENTIALS.password) {
      console.log(RED + '❌ Error: Email y contraseña son requeridos' + RESET);
      return false;
    }
    console.log(GREEN + '✅ Credenciales presentes\n' + RESET);

    // Paso 2: Buscar usuario en la BD
    console.log(YELLOW + `2️⃣  Buscando usuario: ${TEST_CREDENTIALS.email}...` + RESET);
    const user = await prisma.user.findUnique({
      where: { email: TEST_CREDENTIALS.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        profileStatus: true,
      },
    });

    if (!user) {
      console.log(RED + `❌ Error: Usuario no encontrado - ${TEST_CREDENTIALS.email}` + RESET);
      console.log(YELLOW + '\n💡 Solución: Ejecuta npm run seed para crear el usuario admin\n' + RESET);
      return false;
    }

    console.log(GREEN + `✅ Usuario encontrado: ${user.email}` + RESET);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Estado: ${user.profileStatus}\n`);

    // Paso 3: Verificar que tiene contraseña
    console.log(YELLOW + '3️⃣  Verificando contraseña en BD...' + RESET);
    if (!user.password) {
      console.log(RED + '❌ Error: Usuario sin contraseña configurada' + RESET);
      console.log(YELLOW + '\n💡 Solución: El usuario fue creado con Google y no tiene contraseña' + RESET);
      console.log('   Ejecuta npm run seed o configura una contraseña manualmente\n');
      return false;
    }

    console.log(GREEN + '✅ Usuario tiene contraseña configurada' + RESET);
    console.log(`   Hash: ${user.password.substring(0, 20)}...\n`);

    // Paso 4: Verificar formato del hash
    console.log(YELLOW + '4️⃣  Verificando formato del hash...' + RESET);
    const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    if (!isBcryptHash) {
      console.log(RED + '❌ Error: Hash no parece ser de bcrypt' + RESET);
      console.log(`   Hash actual: ${user.password.substring(0, 30)}...`);
      console.log(YELLOW + '\n💡 Solución: Regenerar contraseña con npm run seed\n' + RESET);
      return false;
    }

    console.log(GREEN + '✅ Hash de bcrypt válido' + RESET);
    console.log(`   Formato: ${user.password.substring(0, 7)}\n`);

    // Paso 5: Comparar contraseña
    console.log(YELLOW + '5️⃣  Comparando contraseña con bcrypt...' + RESET);
    console.log(`   Probando: "${TEST_CREDENTIALS.password}"`);
    console.log(`   Contra hash: ${user.password.substring(0, 30)}...`);

    const startTime = Date.now();
    const isPasswordValid = await bcrypt.compare(TEST_CREDENTIALS.password, user.password);
    const duration = Date.now() - startTime;

    if (!isPasswordValid) {
      console.log(RED + '\n❌ Error: Contraseña inválida' + RESET);
      console.log(YELLOW + '\n💡 Posibles causas:' + RESET);
      console.log('   1. El hash en la BD no corresponde a "password123"');
      console.log('   2. La contraseña fue cambiada');
      console.log('   3. El hash está corrupto');
      console.log(YELLOW + '\n💡 Solución: Ejecuta npm run seed para regenerar el usuario\n' + RESET);
      return false;
    }

    console.log(GREEN + `\n✅ Contraseña válida (verificación tomó ${duration}ms)` + RESET);

    // Paso 6: Simular creación de sesión
    console.log('\n' + YELLOW + '6️⃣  Simulando creación de sesión...' + RESET);
    const sessionUser = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profileStatus: user.profileStatus,
    };

    console.log(GREEN + '✅ Sesión creada exitosamente' + RESET);
    console.log('   Datos de sesión:', JSON.stringify(sessionUser, null, 2));

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log(GREEN + '✅ AUTENTICACIÓN EXITOSA' + RESET);
    console.log('='.repeat(70));
    console.log('\n' + CYAN + 'El login con credenciales funciona correctamente en esta BD.' + RESET);
    console.log(CYAN + '\nSi falla en producción pero pasa aquí, verifica:' + RESET);
    console.log('  1. ¿Estás conectado a la BD correcta? (local vs producción)');
    console.log('  2. ¿El usuario admin existe en la BD de PRODUCCIÓN?');
    console.log('  3. ¿Las variables de entorno están configuradas en producción?');
    console.log('  4. ¿NEXTAUTH_SECRET es el mismo en local y producción?');
    console.log('  5. ¿Los logs de producción muestran algún error específico?\n');

    return true;

  } catch (error) {
    console.log('\n' + RED + '❌ ERROR FATAL:' + RESET);
    console.error(error);
    console.log(YELLOW + '\n💡 Verifica tu conexión a la base de datos.\n' + RESET);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testCredentialsAuth()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
