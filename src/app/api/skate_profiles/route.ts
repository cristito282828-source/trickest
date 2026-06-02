import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// Servicio para verificar si el usuario está registrado
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        return NextResponse.json({ registered: !!user }, { status: 200 });
    } catch (error) {
        console.error('Error verificando usuario:', error);
        return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
    }
}

// Registro de Usuario y Redes Sociales
export async function POST(req: Request) {
    try {
        // Extraemos los datos del cuerpo de la solicitud
        const { email, name, phone, photo, departamento, ciudad, facebook, instagram, twitter, tiktok, madero, trucks, ruedas, rodamientos, tenis} = await req.json();

        // Validamos los campos obligatorios
        if (!email || !name || !phone || !photo || !departamento || !ciudad) {
            return NextResponse.json({ error: 'All user fields are required' }, { status: 400 });
        }

        // Crear el usuario
        const user = await prisma.user.create({
            data: {
                email,
                name,
                phone: phone ?? undefined,
                photo,
                departamento,
                ciudad,
                createdAt: new Date(),
            },
        });

        // Registrar o actualizar las redes sociales con el mismo email (usando email como ID)
        const socialMedia = await prisma.socialMedia.upsert({
            where: { userId: email }, // Usamos el correo electrónico como identificador
            update: {
                facebook: facebook ?? undefined,
                instagram: instagram ?? undefined,
                twitter: twitter ?? undefined,
                tiktok: tiktok ?? undefined,
            },
            create: {
                userId: email,
                facebook: facebook ?? undefined,
                instagram: instagram ?? undefined,
                twitter: twitter ?? undefined,
                tiktok: tiktok ?? undefined,
            },
        });
        const dreamSetup = await prisma.wishSkate.upsert({
            where: { userId: email }, // Usamos el correo electrónico como identificador
            update: {
                madero: madero ?? undefined,
                trucks: trucks ?? undefined,
                ruedas: ruedas ?? undefined,
                rodamientos: rodamientos ?? undefined,
            },
            create: {
                userId: email,
                madero: madero ?? undefined,
                trucks: trucks ?? undefined,
                ruedas: ruedas ?? undefined,
                rodamientos: rodamientos ?? undefined,
            },
        });

        // Responder con éxito
        return NextResponse.json({ message: 'Tabla soñada creados con éxito', user, socialMedia }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'There was an error creating the dream setup' }, { status: 500 });
    }
}

