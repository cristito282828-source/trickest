// Script para probar subir una imagen a Supabase Storage
// Uso: node scripts/test-upload.js /path/to/your/image.png

const fs = require('fs');
const path = require('path');

// Tu configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tu-anon-key';

async function uploadImage(filePath) {
  try {
    // Leer el archivo
    const fileBuffer = await fs.promises.readFile(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).toLowerCase();

    // Determinar MIME type
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime'
    };

    const mimeType = mimeTypes[fileExt] || 'application/octet-stream';

    console.log(`📤 Subiendo: ${fileName}`);
    console.log(`📋 MIME Type: ${mimeType}`);
    console.log(`📦 Tamaño: ${fileBuffer.length} bytes`);

    // Subir a Supabase
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/spots-photos/test-${Date.now()}-${fileName}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': mimeType
      },
      body: fileBuffer
    });

    const responseText = await response.text();

    console.log(`\n✅ Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const publicUrl = uploadUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
      console.log(`\n🔗 URL Pública: ${publicUrl}`);
      console.log('\n✅ Imagen subida exitosamente!');
    } else {
      console.log(`\n❌ Error: ${responseText}`);
    }

  } catch (error) {
    console.error('❌ Error al subir:', error.message);
  }
}

// Verificar argumentos
const filePath = process.argv[2];

if (!filePath) {
  console.log('❌ Uso: node scripts/test-upload.js /ruta/a/tu/imagen.png');
  console.log('\nEjemplos:');
  console.log('  node scripts/test-upload.js ./test-image.png');
  console.log('  node scripts/test-upload.js C:/Users/Usuario/Pictures/skatepark.jpg');
  process.exit(1);
}

// Verificar que el archivo existe
if (!fs.existsSync(filePath)) {
  console.log(`❌ El archivo no existe: ${filePath}`);
  process.exit(1);
}

uploadImage(filePath);
