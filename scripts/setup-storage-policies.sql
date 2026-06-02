-- ============================================
-- SETUP SUPABASE STORAGE POLICIES
-- Ejecutar esto en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/fdzsbuiunhirumzimoaw/sql
-- ============================================

-- Paso 1: Habilitar RLS en la tabla de objetos
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own Files" ON storage.objects;

-- Paso 3: Crear política de LECTURA PÚBLICA
-- Cualquiera (anon y authenticated) puede leer archivos del bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'spots-photos');

-- Paso 4: Crear política de SUBIDA PARA AUTENTICADOS
-- Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'spots-photos');

-- Paso 5: Crear política de ELIMINAR PROPIOS ARCHIVOS
-- Usuarios autenticados pueden eliminar solo sus propios archivos
CREATE POLICY "User Delete Own Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'spots-photos'
);

-- Paso 6: Verificar que las políticas se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de almacenamiento creadas exitosamente!';
  RAISE NOTICE 'Bucket: spots-photos';
  RAISE NOTICE 'Permisos:';
  RAISE NOTICE '  - Lectura: Pública (anon + authenticated)';
  RAISE NOTICE '  - Subida: Solo authenticated';
  RAISE NOTICE '  - Eliminación: Solo authenticated (propios archivos)';
END $$;
