import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// 📌 Actualizar o crear redes sociales (mantener POST para compatibilidad)
export async function POST(req: Request) {
    try {
        const { userId, facebook, instagram, twitter, tiktok } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Usar upsert para crear o actualizar
        const socialMedia = await prisma.socialMedia.upsert({
            where: { userId: userId },
            update: {
                facebook: facebook ?? undefined,
                instagram: instagram ?? undefined,
                twitter: twitter ?? undefined,
                tiktok: tiktok ?? undefined,
            },
            create: {
                userId: userId,
                facebook: facebook ?? undefined,
                instagram: instagram ?? undefined,
                twitter: twitter ?? undefined,
                tiktok: tiktok ?? undefined,
            },
        });

        return NextResponse.json({ message: 'Redes sociales actualizadas correctamente', socialMedia }, { status: 200 });
    } catch (error) {
        console.error('Error al actualizar redes sociales:', error);
        return NextResponse.json({ error: 'Error updating social media' }, { status: 500 });
    }
}

// 📌 Actualizar redes sociales usando PUT (consistente con otros endpoints)
export async function PUT(req: Request) {
    console.log("🔧 Actualizando redes sociales...");

    try {
        const data = await req.json();
        console.log("📦 Datos recibidos:", data);

        const { email, facebook, instagram, twitter, tiktok } = data;

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Usar upsert para crear o actualizar
        const updatedSocialMedia = await prisma.socialMedia.upsert({
            where: { userId: email },
            update: {
                facebook,
                instagram,
                twitter,
                tiktok,
            },
            create: {
                userId: email,
                facebook,
                instagram,
                twitter,
                tiktok,
            },
        });

        return NextResponse.json(
            { message: "Redes sociales actualizadas con éxito", updatedSocialMedia },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error al actualizar redes sociales:", error);
        return NextResponse.json(
            { error: "Hubo un error en la actualización" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
      const url = new URL(req.url);
      const email = url.searchParams.get("email");
  
      console.log("🔍 Email recibido en la API:", email);
  
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
  
      // Buscar redes sociales del usuario
      const socialMedia = await prisma.socialMedia.findUnique({
        where: { userId: email },
      });
  
      console.log("🌐 Redes sociales encontradas:", socialMedia);
  
      if (!socialMedia) {
        return NextResponse.json(
          { exists: false, message: "Redes sociales no encontradas" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ exists: true, socialMedia }, { status: 200 });
    } catch (error) {
      console.error("❌ Error en la API de redes sociales:", error);
      return NextResponse.json(
        { error: "Error en el servidor" },
        { status: 500 }
      );
    }
  }