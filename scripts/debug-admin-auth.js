/**
 * Script para debuggear autenticación del admin en producción
 *
 * Verifica:
 * 1. Conexión a la base de datos
 * 2. Existencia del usuario admin
 * 3. Hash de contraseña
 * 4. Comparación de contraseña
 *
 * Uso: node scripts/debug-admin-auth.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Colores para consola
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(CYAN + '🔍 DEBUG: AUTENTICACIÓN DEL ADMIN EN PRODUCCIÓN' + RESET);
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log(YELLOW + '1️⃣  Verificando conexión a la base de datos...' + RESET);
    await prisma.$connect();
    console.log(GREEN + '✅ Conexión exitosa a la base de datos\n' + RESET);

    // 2. Buscar usuario admin
    console.log(YELLOW + '2️⃣  Buscando usuario admin@trickest.com...' + RESET);
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@trickest.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        profileStatus: true,
        createdAt: true,
      },
    });

    if (!admin) {
      console.log(RED + '❌ ERROR: No se encontró el usuario admin@trickest.com' + RESET);
      console.log(YELLOW + '\n💡 Solución: Ejecuta el seed script para crear el usuario admin:' + RESET);
      console.log('   npm run seed\n');
      process.exit(1);
    }

    console.log(GREEN + '✅ Usuario admin encontrado:' + RESET);
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Nombre:', admin.name);
    console.log('   Rol:', admin.role);
    console.log('   Estado Perfil:', admin.profileStatus);
    console.log('   Creado:', admin.createdAt);
    console.log('   Hash de contraseña:', admin.password ? admin.password.substring(0, 20) + '...' : 'NULL');

    // 3. Verificar que tiene contraseña
    console.log('\n' + YELLOW + '3️⃣  Verificando hash de contraseña...' + RESET);
    if (!admin.password) {
      console.log(RED + '❌ ERROR: El usuario admin no tiene contraseña configurada' + RESET);
      console.log(YELLOW + '\n💡 Solución: El usuario admin necesita una contraseña hasheada.' + RESET);
      console.log('   Ejecuta el seed script: npm run seed\n');
      process.exit(1);
    }

    // Verificar formato del hash de bcrypt
    const isBcryptHash = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$');
    if (!isBcryptHash) {
      console.log(RED + '❌ ERROR: La contraseña no parece ser un hash de bcrypt válido' + RESET);
      console.log('   Hash actual:', admin.password.substring(0, 30) + '...');
      console.log(YELLOW + '\n💡 Solución: Regenera el hash de contraseña ejecutando:' + RESET);
      console.log('   npm run seed\n');
      process.exit(1);
    }

    console.log(GREEN + '✅ Hash de contraseña válido (bcrypt)' + RESET);
    console.log('   Formato:', admin.password.substring(0, 7) + '...');

    // 4. Probar la contraseña de prueba (password123)
    console.log('\n' + YELLOW + '4️⃣  Probando comparación de contraseña con "password123"...' + RESET);
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, admin.password);

    if (!isValid) {
      console.log(RED + '❌ ERROR: La contraseña "password123" no coincide con el hash' + RESET);
      console.log(YELLOW + '\n💡 Solución: El hash en la BD no corresponde a "password123".' + RESET);
      console.log('   Opciones:' + RESET);
      console.log('   1. Ejecuta el seed script: npm run seed');
      console.log('   2. O actualiza la contraseña manualmente en la BD\n');

      // Generar nuevo hash para referencia
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(CYAN + '   Hash correcto para "password123":' + RESET);
      console.log('   ' + newHash + '\n');
      process.exit(1);
    }

    console.log(GREEN + '✅ Contraseña "password123" coincide con el hash' + RESET);

    // 5. Verificar rol de admin
    console.log('\n' + YELLOW + '5️⃣  Verificando rol de administrador...' + RESET);
    if (admin.role !== 'admin') {
      console.log(RED + '❌ ERROR: El usuario no tiene rol "admin"' + RESET);
      console.log('   Rol actual:', admin.role);
      console.log(YELLOW + '\n💡 Solución: Actualiza el rol en la base de datos:' + RESET);
      console.log('   UPDATE "User" SET role = \'admin\' WHERE email = \'admin@trickest.com\';\n');
      process.exit(1);
    }

    console.log(GREEN + '✅ Usuario tiene rol de administrador' + RESET);

    // 6. Variables de entorno
    console.log('\n' + YELLOW + '6️⃣  Verificando variables de entorno críticas...' + RESET);
    const envVars = {
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? '[CONFIGURADO]' : undefined,
      'DATABASE_URL': process.env.DATABASE_URL ? '[CONFIGURADO]' : undefined,
    };

    let envOk = true;
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) {
        console.log(RED + `   ❌ ${key}: NO CONFIGURADO` + RESET);
        envOk = false;
      } else {
        console.log(GREEN + `   ✅ ${key}: ${value}` + RESET);
      }
    }

    if (!envOk) {
      console.log(YELLOW + '\n💡 Solución: Configura las variables faltantes en producción (Vercel/Railway/etc.)\n' + RESET);
    }

    // 7. Resumen final
    console.log('\n' + '='.repeat(70));
    console.log(GREEN + '✅ RESUMEN: TODAS LAS VERIFICACIONES PASARON' + RESET);
    console.log('='.repeat(70));
    console.log('\n' + CYAN + 'El usuario admin está correctamente configurado en la base de datos.' + RESET);
    console.log(CYAN + 'Si el login aún falla en producción, verifica:' + RESET);
    console.log('  1. NEXTAUTH_URL debe coincidir exactamente con el dominio de producción');
    console.log('  2. NEXTAUTH_SECRET debe ser el mismo en todos los despliegues');
    console.log('  3. Las cookies se están creando correctamente (sin errores CORS)');
    console.log('  4. Los logs de la aplicación en producción para errores específicos\n');

  } catch (error) {
    console.log('\n' + RED + '❌ ERROR FATAL:' + RESET);
    console.error(error);
    console.log(YELLOW + '\n💡 Solución: Verifica tu conexión a la base de datos y las credenciales.\n' + RESET);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
