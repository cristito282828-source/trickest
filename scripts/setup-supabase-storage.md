# Configuración de Supabase Storage para Fotos de Spots

## Pasos para configurar:

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ir a https://app.supabase.com/project/YOUR-PROJECT-ID/storage
2. Crear un nuevo bucket:
   - Name: `spots-photos`
   - Public: ✅ (marcar como público)
   - File size limit: 5MB
   - Allowed MIME types: `image/*`
3. Repetir para `profile-photos` si es necesario

### Opción 2: Usando el SQL Script

1. Ir a https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new
2. Copiar y ejecutar el contenido de `scripts/create-storage-bucket.sql`
3. Ejecutar el script

## URLs de las fotos una vez subidas:

El formato de los nombres será:
\`\`
spots-photos/user_email_1234567890_photo.jpg
\`\`

La URL pública será:
\`\`
https://YOUR-PROJECT-ID.supabase.co/storage/v1/object/public/spots-photos/user_email_1234567890_photo.jpg
\`\`

## Políticas de Seguridad (Row Level Security):

- ✅ Público puede LEER todas las fotos
- ✅ Autenticados pueden SUBIR fotos
- ✅ Usuarios solo pueden ELIMINAR sus propias fotos

## Integración con el Frontend:

El componente `PhotoUploader.tsx` ya está configurado para:
- Convertir imágenes a base64
- Subir a Supabase Storage
- Retornar la URL pública
- Mostrar preview de las fotos subidas
