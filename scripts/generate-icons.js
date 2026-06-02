const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
const inputFile = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Create icons directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generando iconos desde:', inputFile);

    // Generate icons for each size
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);

      console.log(`✅ Generado: icon-${size}x${size}.png`);
    }

    // Generate favicon.ico (using 32x32)
    const faviconFile = path.join(__dirname, '../public/favicon.ico');
    await sharp(inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconFile);

    console.log('✅ Generado: favicon.ico');

    // Generate apple-touch-icon.png (180x180)
    const appleTouchIcon = path.join(__dirname, '../public/apple-touch-icon.png');
    await sharp(inputFile)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(appleTouchIcon);

    console.log('✅ Generado: apple-touch-icon.png');

    console.log('\n🎉 ¡Todos los iconos generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
    process.exit(1);
  }
}

generateIcons();
