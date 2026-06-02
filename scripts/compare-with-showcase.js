/**
 * Script para comparar nuestro código con el del showcase
 * Descarga el repo y muestra la implementación de Realtime
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoUrl = 'https://github.com/shwosner/realtime-chat-supabase-react.git';
const tempDir = path.join(__dirname, '../temp-showcase');

console.log('🔍 Descargando repo de showcase...');

try {
  // Crear directorio temp si no existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Clonar repo
  console.log('📥 Clonando repositorio...');
  execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: 'inherit' });

  console.log('\n✅ Repositorio descargado!\n');
  console.log('📂 Ubicación:', tempDir);
  console.log('\n📝 Archivos clave para revisar:');
  console.log('   - src/App.jsx (o App.js)');
  console.log('   - src/components/Chat.jsx');
  console.log('   - Cualquier archivo que use "supabase.channel"');
  console.log('\n💡 Busca: ".on(\'postgres_changes\'" en los archivos');

  // Buscar archivos con postgres_changes
  console.log('\n🔎 Buscando archivos con "postgres_changes"...');
  const grep = execSync(`cd ${tempDir} && grep -r "postgres_changes" --include="*.js" --include="*.jsx" src/`, { encoding: 'utf-8' });
  console.log(grep);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  console.log('\n✨ Puedes revisar el código descargado en:', tempDir);
}
