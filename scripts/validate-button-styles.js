/**
 * Script para detectar botones con degradados (gradients)
 *
 * Este script escanea el código buscando patrones de botones
 * que usan degradados, lo cual está prohibido según las guías de diseño.
 *
 * Uso: node scripts/validate-button-styles.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Patrones prohibidos
const FORBIDDEN_PATTERNS = [
  {
    pattern: /(<button[^>]*className="[^"]*bg-gradient-to-[^"]*")/gi,
    message: 'Botón <button> con bg-gradient detectado'
  },
  {
    pattern: /(<a[^>]*className="[^"]*bg-gradient-to-[^"]*"[^>]*>[\s\S]*?<\/a>)/gi,
    message: 'Enlace <a> con bg-gradient detectado (posible botón)'
  },
  {
    pattern: /(className=["'][^"']*from-\w+-\d+\s+to-\w+-\d+\s+hover:from-)/gi,
    message: 'Degradado con hover detectado (from-* to-* hover:from-*)'
  }
];

// Directorios a escanear
const SCAN_DIRS = [
  'src/app',
  'src/components'
];

// Extensiones de archivo a revisar
const VALID_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

let totalIssues = 0;
const issuesByFile = new Map();

/**
 * Escanea recursivamente un directorio
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorar node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (VALID_EXTENSIONS.includes(path.extname(file))) {
      scanFile(fullPath);
    }
  });
}

/**
 * Escanea un archivo buscando patrones prohibidos
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileIssues = [];

  FORBIDDEN_PATTERNS.forEach(({ pattern, message }) => {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      // Encontrar el número de línea
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      fileIssues.push({
        line: lineNumber,
        message,
        snippet: lines[lineNumber - 1]?.trim().substring(0, 100)
      });

      totalIssues++;
    }
  });

  if (fileIssues.length > 0) {
    issuesByFile.set(filePath, fileIssues);
  }
}

/**
 * Imprime los resultados
 */
function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VALIDACIÓN DE ESTILOS DE BOTONES');
  console.log('='.repeat(70) + '\n');

  if (totalIssues === 0) {
    console.log(GREEN + '✅ ¡Excelente! No se encontraron botones con degradados.' + RESET);
    console.log(GREEN + '   Todos los botones usan colores sólidos.' + RESET + '\n');
    return true;
  }

  console.log(RED + `❌ Se encontraron ${totalIssues} problema(s) en ${issuesByFile.size} archivo(s):\n` + RESET);

  issuesByFile.forEach((issues, file) => {
    console.log(YELLOW + `📄 ${file}` + RESET);
    issues.forEach(({ line, message, snippet }) => {
      console.log(`   Línea ${line}: ${RED}${message}${RESET}`);
      console.log(`   ${snippet}\n`);
    });
  });

  console.log(YELLOW + '\n💡 Solución:' + RESET);
  console.log('   Cambia los degradados por colores sólidos:');
  console.log('   ❌ bg-gradient-to-r from-yellow-500 to-orange-500');
  console.log('   ✅ bg-yellow-500 hover:bg-yellow-600\n');
  console.log('   Ver guía completa en: docs/BUTTON_GUIDELINES.md\n');

  return false;
}

// Ejecutar validación
console.log('Escaneando archivos...\n');

SCAN_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

const passed = printResults();
process.exit(passed ? 0 : 1);
