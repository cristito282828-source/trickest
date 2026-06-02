import { NextResponse } from "next/server";
import prisma from '@/app/lib/prisma';

// 📌 Obtener WishSkate por email de usuario
export async function GET(req: Request) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const wishSkate = await prisma.wishSkate.findUnique({
      where: { userId: email },
    });

    if (!wishSkate) {
      return NextResponse.json(
        { exists: false, message: "WishSkate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ exists: true, wishSkate }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}

// 📌 Actualizar WishSkate por email de usuario
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { email, madero, trucks, ruedas, rodamientos, tenis } = data;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Usar upsert para crear o actualizar WishSkate
    const updatedWishSkate = await prisma.wishSkate.upsert({
      where: { userId: email },
      update: {
        madero,
        trucks,
        ruedas,
        rodamientos,
        tenis,
      },
      create: {
        userId: email,
        madero,
        trucks,
        ruedas,
        rodamientos,
        tenis,
      },
    });

    return NextResponse.json(
      { message: "WishSkate actualizado con éxito", updatedWishSkate },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Hubo un error en la actualización" },
      { status: 500 }
    );
  }
}
