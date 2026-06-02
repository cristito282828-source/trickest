const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function readEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    return content;
  } catch (e) {
    return null;
  }
}

function getDatabaseUrlFromEnv(content) {
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith('DATABASE_URL=')) {
      return line.split('=', 2)[1].trim();
    }
  }
  return null;
}

function parseConnectionString(url) {
  if (!url) return null;
  // Workaround: the WHATWG URL class doesn't accept postgresql://, replace with http:// temporarily
  const fake = url.replace(/^postgres(ql)?:\/\//, 'http://');
  try {
    const u = new URL(fake);
    const [userPart, hostPart] = url.replace(/^.*:\/\//, '').split('@');
    const [user, passEnc] = userPart.split(':');
    const password = passEnc ? decodeURIComponent(passEnc) : undefined;
    return {
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname ? u.pathname.replace(/^\//, '') : undefined,
      user,
      password,
      raw: url,
    };
  } catch (e) {
    return { raw: url };
  }
}

async function main() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = readEnvFile(envPath) || '';
  const dbUrlEnv = process.env.DATABASE_URL || getDatabaseUrlFromEnv(envContent);
  const directUrlEnv = process.env.DIRECT_URL || (() => {
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().startsWith('DIRECT_URL=')) return line.split('=', 2)[1].trim();
    }
    return null;
  })();

  if (!dbUrlEnv && !directUrlEnv) {
    console.error('No se encontró `DATABASE_URL` ni `DIRECT_URL` en el entorno ni en `.env`.');
    process.exit(2);
  }

  // Intentamos primero DATABASE_URL, si falla intentamos DIRECT_URL (puerto 5432)
  const candidates = [];
  if (dbUrlEnv) candidates.push({ key: 'DATABASE_URL', url: dbUrlEnv });
  if (directUrlEnv) candidates.push({ key: 'DIRECT_URL', url: directUrlEnv });

  let lastError = null;
  for (const candidate of candidates) {
    console.log(`\nProbando ${candidate.key} ...`);
    const info = parseConnectionString(candidate.url);
    console.log('Parsed connection info:');
    console.log(`  Host: ${info.host || '-'}\n  Port: ${info.port || '-'}\n  Database: ${info.database || '-'}\n  User (from URL): ${info.user || '-'}\n  Password (decoded): ${info.password ? '[hidden]' : '-'}\n`);

    console.log(`Intentando conectar usando ${candidate.key}...`);
    const client = new Client({ connectionString: candidate.url });
    try {
      await client.connect();
      const res = await client.query("SELECT current_user, session_user;");
      console.log('Query result:');
      console.log(res.rows[0]);
      await client.end();
      process.exit(0);
    } catch (err) {
      lastError = err;
      console.error('Error al conectar o ejecutar la consulta con ' + candidate.key + ':');
      console.error(err.message || err);
      try { await client.end(); } catch (_) {}
      // continue to next candidate
    }
  }

  console.error('\nSe intentaron todas las URLs disponibles y ninguna funcionó. Error final:');
  console.error(lastError && lastError.message ? lastError.message : lastError);
  process.exit(3);
}

main().catch((e) => {
  console.error('Unexpected error:', e && e.message ? e.message : e);
  process.exit(4);
});
