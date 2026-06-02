import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes' },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no debe superar 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s/g, '_');
    const fileName = `profile-photos/${session.user.email.replace('@', '_')}_${timestamp}_${originalName}`;

    // Subir a Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY no está configurado');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/trickest-spots/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': file.type,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Error subiendo a Supabase:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: errorText,
        filename: fileName,
      });
      return NextResponse.json(
        { error: 'Error al subir la imagen a Supabase' },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/trickest-spots/${fileName}`;

    console.log('✅ Foto de perfil subida exitosamente:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Imagen subida successfully',
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}
