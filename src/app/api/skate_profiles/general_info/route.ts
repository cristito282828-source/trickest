import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { registered: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ Devuelve los datos completos
    return NextResponse.json({ registered: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Actualización de Usuario (sin modificar email ni foto)
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const {
      email,
      username,
      name,
      phone,
      photo,
      gender,
      estado,
      departamento,
      ciudad,
      birthdate,
      birthskate,
    } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Si se proporciona username, verificar que sea único
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          email: { not: email },
        },
      });
      if (existingUsername) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Determinar el profileStatus
    let profileStatus = existingUser.profileStatus;

    // Si tiene phone, ciudad y departamento, cambiar a "complete"
    if (phone && ciudad && departamento) {
      profileStatus = 'complete';
    }

    // Actualizar los datos del usuario (incluye photo si se proporciona)
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        username: username || undefined,
        name,
        phone,
        ...(photo && { photo }), // Solo actualiza photo si se proporciona
        gender,
        departamento,
        ciudad,
        estado,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        birthskate: birthskate ? new Date(birthskate) : undefined,
        profileStatus,
      },
    });

    return NextResponse.json(
      { message: 'Usuario actualizado con éxito', updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'There was an error updating' },
      { status: 500 }
    );
  }
}
