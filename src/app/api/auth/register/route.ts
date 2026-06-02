import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema, validateRequest, handleValidationError, successResponse, errorResponse } from '@/lib/validation';
import { rateLimitCheck, rateLimitResponse, RateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 intentos por hora
    const rateLimit = await rateLimitCheck(req, RateLimits.register);

    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();

    // Validar con Zod
    const validatedData = await validateRequest(registerSchema, body);
    const { email, password, name } = validatedData;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('USER_EXISTS', 'This email is already registered', 400);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || '',
        profileStatus: 'basic',
      },
    });

    return successResponse({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, 201);

  } catch (error) {
    // Manejar errores de validación
    const validationResponse = handleValidationError(error);
    if (validationResponse) return validationResponse;

    // Otros errores
    console.error('Error creando usuario:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return errorResponse('INTERNAL_ERROR', 'Error creating user', 500);
  }
}
