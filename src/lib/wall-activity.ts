import { WallActivityType } from '@prisma/client';
import prisma from '@/app/lib/prisma';

export async function isWallActivityVisible(type: WallActivityType, sourceId: number) {
  switch (type) {
    case WallActivityType.USER_JOINED:
      return Boolean(await prisma.user.findFirst({
        where: { id: sourceId, isActive: true, profileStatus: 'complete' },
        select: { id: true },
      }));
    case WallActivityType.TEAM_CREATED:
      return Boolean(await prisma.team.findFirst({
        where: { id: sourceId, isActive: true },
        select: { id: true },
      }));
    case WallActivityType.CHALLENGE_CREATED:
      return Boolean(await prisma.challenge.findUnique({
        where: { id: sourceId },
        select: { id: true },
      }));
    case WallActivityType.SUBMISSION_APPROVED:
      return Boolean(await prisma.submission.findFirst({
        where: {
          id: sourceId,
          status: 'approved',
          videoUrl: { not: '' },
          OR: [{ videoSource: 'youtube' }, { videoStatus: 'ready' }],
        },
        select: { id: true },
      }));
    case WallActivityType.SPOT_ADDED: {
      const spot = await prisma.spot.findUnique({
        where: { id: sourceId },
        select: { createdBy: true },
      });
      if (!spot) return false;
      const creator = await prisma.user.findUnique({
        where: { email: spot.createdBy },
        select: { isActive: true, showOnMap: true },
      });
      return Boolean(creator?.isActive && creator.showOnMap);
    }
    case WallActivityType.PRODUCT_ADDED:
      return sourceId > 0;
    default:
      return false;
  }
}
