# Configuración de Formatos de Imagen para Supabase Storage

## Formatos Permitidos

### Imágenes:
- `image/png` - PNG
- `image/jpeg` - JPEG/JPG
- `image/gif` - GIF
- `image/webp` - WebP
- `image/svg+xml` - SVG

### Videos:
- `video/mp4` - MP4
- `video/webm` - WebM
- `video/quicktime` - MOV

## Configuración del Bucket en Supabase

### Paso 1: Ir al Bucket
1. Entra a Supabase Dashboard
2. Ve a Storage → spots-photos
3. Haz clic en Configuration

### Paso 2: Configurar Allowed MIME Types
En "Allowed MIME Types", agrega los valores separados por comas:

```
image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml, video/mp4, video/webm
```

O alternativamente, puedes usar el comodín:

```
image/*, video/*
```

### Paso 3: Configuración de Transformaciones (Opcional)
Si quieres que Supabase transforme las imágenes automáticamente, agrega:

```
image/png → thumbnail (200x200)
image/jpeg → thumbnail (400x400)
```

## Subir Imagen Manualmente

### Opción 1: Desde el Dashboard de Supabase

1. Ve a Storage → spots-photos
2. Haz clic en "Upload"
3. Selecciona una imagen (PNG, JPG, etc.)
4. La ruta será: `spots-photos/tu-imagen.png`

### Opción 2: Desde la Consola del Browser

Abre la consola del navegador (F12) y ejecuta:

```javascript
const BUCKET_URL = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/spots-photos';
const ANON_KEY = '[YOUR-ANON-KEY]';

// Convertir imagen a base64
const file = event.target.files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result;
  const mimeType = file.type;
  const buffer = Uint8Array.from(atob(base64.split(',')[1]), c => c.charCodeAt(0));

  const response = await fetch(`${BUCKET_URL}/test-image.png`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': mimeType
    },
    body: buffer
  });

  console.log('Upload status:', response.status);
  console.log('Upload response:', await response.json());
};

reader.readAsDataURL(file);
```

### Opción 3: Usando cURL

```bash
# Subir una imagen PNG
curl -X POST "https://[YOUR-PROJECT].supabase.co/storage/v1/object/spots-photos/test.png" \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: image/png" \
  --data-binary "@/path/to/your/image.png"

# Subir una imagen JPG
curl -X POST "https://[YOUR-PROJECT].supabase.co/storage/v1/object/spots-photos/test.jpg" \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/your/image.jpg"
```

## Verificar la Imagen Subida

### URL Pública:
```
https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/spots-photos/test.png
```

### Verificar desde el Browser:
```javascript
fetch('https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/spots-photos/test.png')
  .then(r => r.blob())
  .then(blob => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
```

## Troubleshooting

### Error: "MIME type not supported"
- Solución: Verifica que el MIME type esté en la lista de permitidos en Configuration

### Error: "Permission denied"
- Solución: Verifica las RLS policies en SQL Editor

### Error: "Bucket not found"
- Solución: Crea el bucket primero en Storage → spots-photos

### La imagen no carga en el navegador
- Solución 1: Verifica que el bucket sea público
- Solución 2: Revisa las policies de SELECT para `anon` y `authenticated`
