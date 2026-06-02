import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener configuración
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      // Obtener un setting específico
      const setting = await prisma.appSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        // Si no existe, devolver valor por defecto
        if (key === 'total_levels') {
          return NextResponse.json({ key, value: '8', description: 'Total de niveles en el sistema' });
        }
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json(setting);
    }

    // Obtener todos los settings
    const settings = await prisma.appSettings.findMany();
    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Error obteniendo settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST/PUT - Actualizar configuración (solo admins)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar que el usuario es admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, email: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized. Only admins can modify settings.' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value, description } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Validar según el tipo de setting
    if (key === 'total_levels') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1 || numValue > 20) {
        return NextResponse.json({ error: 'Total levels must be between 1 and 20' }, { status: 400 });
      }
    }

    // Upsert (crear o actualizar)
    const setting = await prisma.appSettings.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined,
        updatedBy: user.email,
      },
      create: {
        key,
        value,
        description: description || `Configuration for ${key}`,
        updatedBy: user.email,
      },
    });

    return NextResponse.json({ success: true, setting });

  } catch (error) {
    console.error('Error actualizando settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
