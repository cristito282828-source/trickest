-- Crear bucket de spots-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spots-photos',
  'Spots Photos',
  true,
  10485760, -- 10MB en bytes
  ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*', 'video/*'];

-- Habilitar RLS (Row Level Security)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer (público)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'spots-photos');

-- Política: Usuarios autenticados pueden subir
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'spots-photos');

-- Política: Usuarios pueden eliminar sus propios archivos
CREATE POLICY "User Delete Own Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'spots-photos' AND
  auth.uid()::text = SPLIT_PART(name, '_')[1]
);

-- Confirmación
SELECT 'Bucket spots-photos creado exitosamente' as status;
