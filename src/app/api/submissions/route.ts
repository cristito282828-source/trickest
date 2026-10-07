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

    const rawBody = await req.json();
    console.log('[submissions] Body recibido:', JSON.stringify(rawBody));
    const validatedData = await validateRequest(submitTrickSchema, rawBody);
    const { challengeId, videoUrl, muxUploadId } = validatedData;
    console.log('[submissions] Validado OK:', { challengeId, videoUrl, muxUploadId });

    const challengeIdNum = parseInt(challengeId, 10);

    // Verificar challenge existe
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeIdNum },
    });
    if (!challenge) {
      return errorResponse('CHALLENGE_NOT_FOUND', 'Challenge not found', 404);
    }

    // Verificar duplicado
    // Regla: 1 intento + 1 retry en caso de rechazo (max 2 attempts)
    const existingSubs = await prisma.submission.findMany({
      where: {
        userId: session.user.email,
        challengeId: challengeIdNum,
      },
      select: { id: true, status: true },
    });

    const hasApproved = existingSubs.some(s => s.status === 'approved');
    const hasPending = existingSubs.some(s => s.status === 'pending');
    const rejectedCount = existingSubs.filter(s => s.status === 'rejected').length;

    if (hasApproved) {
      return errorResponse(
        'CHALLENGE_ALREADY_COMPLETED',
        `Ya completaste este challenge con éxito. No puedes enviar más intentos.`,
        409
      );
    }
    if (hasPending) {
      return errorResponse(
        'SUBMISSION_PENDING',
        `Ya tienes un intento pendiente de evaluación. Espera el resultado.`,
        409
      );
    }
    if (rejectedCount >= 2) {
      return errorResponse(
        'MAX_ATTEMPTS_REACHED',
        `Ya usaste tus 2 oportunidades en este challenge.`,
        409
      );
    }
    const attemptNumber = rejectedCount + 1; // 1 = primer intento, 2 = retry

    // ═══════════════════════════════════════════════════════════════
    // MODO 1: Mux (nuevo, recomendado)
    // ═══════════════════════════════════════════════════════════════
    if (muxUploadId) {
      console.log('[submissions] MODO MUX, uploadId:', muxUploadId);
      // Consultamos a Mux para obtener el asset_id a partir del upload_id
      let assetId: string;
      try {
        const upload = await mux.video.uploads.retrieve(muxUploadId);
        console.log('[submissions] Mux upload retrieved:', { asset_id: upload.asset_id, status: upload.status });
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
        const msg = muxErr instanceof Error ? muxErr.message : String(muxErr);
        return errorResponse(
          'MUX_UPLOAD_NOT_FOUND',
          `No se encontró el upload en Mux: ${msg}. Vuelve a subir el video.`,
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
          message:
            attemptNumber === 1
              ? 'Submission creada. Pendiente de evaluación.'
              : `Intento #${attemptNumber} (retry) enviado. Pendiente de evaluación.`,
          submission,
          attemptNumber,
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