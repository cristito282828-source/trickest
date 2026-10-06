import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { validateYouTubeUrl, normalizeYouTubeUrl } from '@/lib/youtube';
import { mux } from '@/lib/mux';
import { authOptions } from '@/lib/auth';
import {
  submitTrickSchema,
  validateRequest,
  handleValidationError,
  successResponse,
  errorResponse,
} from '@/lib/validation';
import { rateLimitCheck, rateLimitResponse, RateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/submissions
 *
 * Crea una submission de truco. Acepta DOS modos (compatibilidad):
 *
 *   1. LEGACY (YouTube):
 *      { challengeId, videoUrl }   // YouTube URL pública
 *
 *   2. NUEVO (Mux):
 *      { challengeId, muxUploadId } // ID del direct upload creado en /api/uploads
 *
 * En el modo Mux, el server consulta a Mux para resolver el uploadId → assetId.
 * Si el asset todavía no está creado (Mux tarda unos segundos), respondemos
 * 202 Accepted y el cliente puede reintentar.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    // Rate limit
    const rateLimit = await rateLimitCheck(req, RateLimits.submitTrick);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();
    const validatedData = await validateRequest(submitTrickSchema, body);
    const { challengeId, videoUrl, muxUploadId } = validatedData;

    const challengeIdNum = parseInt(challengeId, 10);

    // Verificar challenge existe
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeIdNum },
    });
    if (!challenge) {
      return errorResponse('CHALLENGE_NOT_FOUND', 'Challenge not found', 404);
    }

    // Verificar duplicado
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: session.user.email,
        challengeId: challengeIdNum,
      },
    });
    if (existingSubmission) {
      return errorResponse(
        'DUPLICATE_SUBMISSION',
        `You already submitted for the challenge "${challenge.name}". Status: ${existingSubmission.status}`,
        409
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO 1: Mux (nuevo, recomendado)
    // ═══════════════════════════════════════════════════════════════
    if (muxUploadId) {
      // Consultamos a Mux para obtener el asset_id a partir del upload_id
      let assetId: string;
      try {
        const upload = await mux.video.uploads.retrieve(muxUploadId);
        if (!upload.asset_id) {
          // El asset aún no se creó (puede pasar si el webhook no ha llegado)
          return NextResponse.json(
            {
              success: false,
              code: 'UPLOAD_PROCESSING',
              message: 'Tu video se está procesando. Espera unos segundos y vuelve a intentar.',
            },
            { status: 202 }
          );
        }
        assetId = upload.asset_id;
      } catch (muxErr) {
        console.error('[submissions] Error consultando Mux upload:', muxErr);
        return errorResponse(
          'MUX_UPLOAD_NOT_FOUND',
          'No se encontró el upload en Mux. Vuelve a subir el video.',
          404
        );
      }

      const submission = await prisma.submission.create({
        data: {
          userId: session.user.email,
          challengeId: challengeIdNum,
          // videoUrl queda como string vacío por ahora — el webhook lo llenará con la signed URL
          videoUrl: '',
          videoSource: 'mux',
          muxUploadId,
          muxAssetId: assetId,
          videoStatus: 'processing',
          status: 'pending',
          submittedAt: new Date(),
        },
        include: {
          challenge: {
            select: {
              name: true,
              level: true,
              difficulty: true,
              points: true,
            },
          },
        },
      });

      // Notificar a jueces (igual que antes)
      await notifyJudges(session, submission, challengeIdNum);

      return successResponse(
        {
          message: 'Submission created. Video processing started.',
          submission,
        },
        201
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO 2: YouTube (legacy, para no romper lo que ya existe)
    // ═══════════════════════════════════════════════════════════════
    if (!videoUrl || !validateYouTubeUrl(videoUrl)) {
      return errorResponse(
        'INVALID_VIDEO_URL',
        'Provide a valid YouTube URL or a muxUploadId.',
        400
      );
    }

    const normalizedUrl = normalizeYouTubeUrl(videoUrl);

    const submission = await prisma.submission.create({
      data: {
        userId: session.user.email,
        challengeId: challengeIdNum,
        videoUrl: normalizedUrl,
        videoSource: 'youtube',
        status: 'pending',
        submittedAt: new Date(),
      },
      include: {
        challenge: {
          select: {
            name: true,
            level: true,
            difficulty: true,
            points: true,
          },
        },
      },
    });

    await notifyJudges(session, submission, challengeIdNum);

    return successResponse(
      {
        message: 'Submission created successfully',
        submission,
      },
      201
    );
  } catch (error) {
    const validationResponse = handleValidationError(error);
    if (validationResponse) return validationResponse;

    console.error('Error creando submission:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return errorResponse('INTERNAL_ERROR', 'Server error', 500);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper: notifica a jueces y admins (extraído para usar en ambos modos)
// ─────────────────────────────────────────────────────────────────
async function notifyJudges(session: any, submission: any, challengeIdNum: number) {
  try {
    const judgesAndAdmins = await prisma.user.findMany({
      where: { role: { in: ['judge', 'admin'] } },
      select: { email: true },
    });

    if (judgesAndAdmins.length > 0) {
      const skaterName = session.user.name || session.user.email || 'Un skater';
      const challengeName = submission.challenge?.name || 'un challenge';

      await prisma.notification.createMany({
        data: judgesAndAdmins.map((judge) => ({
          userId: judge.email,
          type: 'submission_pending',
          title: '🛹 Nueva submission por calificar',
          message: `${skaterName} subió un truco para "${challengeName}" y necesita tu evaluación.`,
          link: '/dashboard/judges/evaluate',
          metadata: {
            submissionId: submission.id,
            challengeId: challengeIdNum,
            challengeName,
            skaterEmail: session.user.email,
            skaterName,
          },
        })),
      });
    }
  } catch (notifError) {
    console.error('Error creando notificaciones para jueces:', notifError);
  }
}