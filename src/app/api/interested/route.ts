import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validar email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.interestedUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email ya registrado', alreadyExists: true },
        { status: 200 }
      );
    }

    // Crear nuevo registro
    const interestedUser = await prisma.interestedUser.create({
      data: { email },
    });

    console.log('✅ Nuevo usuario interesado registrado:', email);

    return NextResponse.json(
      {
        message: 'Email registered successfully',
        user: interestedUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al registrar email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const count = await prisma.interestedUser.count();
    return NextResponse.json({ total: count });
  } catch (error) {
    console.error('Error al obtener conteo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
