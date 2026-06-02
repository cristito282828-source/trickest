#!/usr/bin/env node

/**
 * Patch for Next.js build issue with Node v22 and missing generateBuildId
 *
 * This script patches Next.js files to work when generateBuildId is not defined.
 * This is a temporary workaround until the issue is properly fixed.
 */

const fs = require('fs');
const path = require('path');

const BUILD_INDEX_PATH = path.join(__dirname, '../node_modules/next/dist/build/index.js');

console.log('🔧 Checking Next.js Node compatibility...');

try {
  if (!fs.existsSync(BUILD_INDEX_PATH)) {
    console.log('⏭️  Next.js not found, skipping patch');
    process.exit(0);
  }

  let content = fs.readFileSync(BUILD_INDEX_PATH, 'utf8');

  // Check if already patched
  if (content.includes('PATCHED_NEXT_BUILD_ID')) {
    console.log('✅ Already patched');
    process.exit(0);
  }

  // Patch the call to generateBuildId to handle undefined config.generateBuildId
  const oldPattern = /\(0, _generatebuildid\.generateBuildId\)\(config\.generateBuildId, _indexcjs\.nanoid\)/g;
  const newPattern = `(0, _generatebuildid.generateBuildId)(config.generateBuildId || (async () => null), _indexcjs.nanoid)`;

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, `// PATCHED_NEXT_BUILD_ID\n${newPattern}`);
    fs.writeFileSync(BUILD_INDEX_PATH, content, 'utf8');
    console.log('✅ Next.js patched successfully!');
  } else {
    console.log('⏭️  Patch pattern not found, might be different Next.js version');
  }
} catch (error) {
  console.error('❌ Failed to patch Next.js:', error.message);
  // Don't fail the build
  process.exit(0);
}
