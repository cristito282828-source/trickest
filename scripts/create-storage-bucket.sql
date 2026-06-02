-- Crear bucket para fotos de spots
INSERT INTO storage.buckets (id, name, public)
VALUES ('spots-photos', 'Spots Photos', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'Profile Photos', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para videos de submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-videos', 'Submission Videos', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de seguridad (RLS) para spots-photos
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política: Público puede leer
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (true);

-- Política: Autenticados pueden subir
CREATE POLICY "Authenticated Upload Access" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Política: Usuario solo puede eliminar sus propios archivos
CREATE POLICY "User Delete Own Files" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = (SPLIT_PART(name, '_')::text)[1]
);
