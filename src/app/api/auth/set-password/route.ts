import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { setPasswordSchema, validateRequest, handleValidationError, successResponse, errorResponse } from '@/lib/validation';
import { rateLimitCheck, rateLimitResponse, RateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 intentos por hora
    const rateLimit = await rateLimitCheck(req, RateLimits.setPassword);

    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();

    // Validar con Zod
    const validatedData = await validateRequest(setPasswordSchema, body);
    const { email, password } = validatedData;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar usuario con contraseña
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    return successResponse({
      message: 'Password set successfully',
    });

  } catch (error) {
    // Manejar errores de validación
    const validationResponse = handleValidationError(error);
    if (validationResponse) return validationResponse;

    // Otros errores
    console.error('Error estableciendo contraseña:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return errorResponse('INTERNAL_ERROR', 'Error setting password', 500);
  }
}
