import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { WallActivityType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import CommunityWall from '@/components/CommunityWall';

export const dynamic = 'force-dynamic';

export default async function CommunityWallPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    redirect('/');
  }

  const [
    currentUser,
    recentUsers,
    recentTeams,
    recentChallenges,
    recentSubmissions,
    recentSpots,
    memberCount,
    teamCount,
    challengeCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { name: true, photo: true, username: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, profileStatus: 'complete' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, photo: true, username: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        logo: true,
        createdAt: true,
        owner: { select: { name: true, photo: true, username: true } },
      },
    }),
    prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, level: true, points: true, createdAt: true },
    }),
    prisma.submission.findMany({
      where: {
        status: 'approved',
        videoUrl: { not: '' },
        OR: [{ videoSource: 'youtube' }, { videoStatus: 'ready' }],
      },
      orderBy: { evaluatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        videoUrl: true,
        submittedAt: true,
        evaluatedAt: true,
        challenge: { select: { name: true } },
        user: { select: { name: true, photo: true, username: true } },
      },
    }),
    prisma.spot.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        photos: true,
        createdAt: true,
        createdBy: true,
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.team.count({ where: { isActive: true } }),
    prisma.challenge.count(),
  ]);

  const spotCreators = await prisma.user.findMany({
    where: { email: { in: [...new Set(recentSpots.map((spot) => spot.createdBy))] } },
    select: { email: true, name: true, photo: true, username: true, showOnMap: true },
  });
  const creatorsByEmail = new Map(spotCreators.map((user) => [user.email, user]));
  const visibleSpots = recentSpots.filter(
    (spot) => creatorsByEmail.get(spot.createdBy)?.showOnMap
  );

  const activities = [
    ...recentUsers.map((user) => ({
      id: `user-${user.id}`,
      sourceType: WallActivityType.USER_JOINED,
      sourceId: user.id,
      type: 'user_joined' as const,
      createdAt: user.createdAt.toISOString(),
      actor: {
        name: user.name || user.username || 'Skater',
        photo: user.photo,
        username: user.username,
      },
      titleName: user.name || user.username || 'Skater',
    })),
    ...recentTeams.map((team) => ({
      id: `team-${team.id}`,
      sourceType: WallActivityType.TEAM_CREATED,
      sourceId: team.id,
      type: 'team_created' as const,
      createdAt: team.createdAt.toISOString(),
      actor: {
        name: team.owner.name || team.owner.username || 'Skater',
        photo: team.owner.photo,
        username: team.owner.username,
      },
      titleName: team.name,
      image: team.logo,
    })),
    ...recentChallenges.map((challenge) => ({
      id: `challenge-${challenge.id}`,
      sourceType: WallActivityType.CHALLENGE_CREATED,
      sourceId: challenge.id,
      type: 'challenge_created' as const,
      createdAt: challenge.createdAt.toISOString(),
      actor: { name: 'Trickest', photo: null, username: null },
      titleName: challenge.name,
      level: challenge.level,
      points: challenge.points,
    })),
    ...recentSubmissions
      .filter((submission) => submission.user)
      .map((submission) => ({
        id: `submission-${submission.id}`,
        sourceType: WallActivityType.SUBMISSION_APPROVED,
        sourceId: submission.id,
        type: 'submission_approved' as const,
        createdAt: (submission.evaluatedAt || submission.submittedAt).toISOString(),
        actor: {
          name: submission.user.name || submission.user.username || 'Skater',
          photo: submission.user.photo,
          username: submission.user.username,
        },
        titleName: submission.challenge.name,
        videoUrl: toSafeVideoUrl(submission.videoUrl),
      })),
    ...visibleSpots.map((spot) => {
      const creator = creatorsByEmail.get(spot.createdBy);
      return {
        id: `spot-${spot.id}`,
        sourceType: WallActivityType.SPOT_ADDED,
        sourceId: spot.id,
        type: 'spot_added' as const,
        createdAt: spot.createdAt.toISOString(),
        actor: {
          name: creator?.name || creator?.username || 'Skater',
          photo: creator?.photo || null,
          username: creator?.username || null,
        },
        titleName: spot.name,
        city: spot.city,
        country: spot.country,
        image: spot.photos[0] || null,
      };
    }),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 24);

  await prisma.wallActivity.createMany({
    data: activities.map(({ sourceType, sourceId, createdAt }) => ({
      type: sourceType,
      sourceId,
      createdAt: new Date(createdAt),
    })),
    skipDuplicates: true,
  });

  const wallActivities = await prisma.wallActivity.findMany({
    where: {
      OR: activities.map(({ sourceType, sourceId }) => ({
        type: sourceType,
        sourceId,
      })),
    },
    select: { id: true, type: true, sourceId: true },
  });
  const activityIds = wallActivities.map((activity) => activity.id);
  const [reactionGroups, userReactions] = activityIds.length
    ? await Promise.all([
        prisma.wallReaction.groupBy({
          by: ['activityId', 'type'],
          where: { activityId: { in: activityIds } },
          _count: { _all: true },
        }),
        prisma.wallReaction.findMany({
          where: { activityId: { in: activityIds }, userId: email },
          select: { activityId: true, type: true },
        }),
      ])
    : [[], []];

  const wallActivityIdsBySource = new Map(
    wallActivities.map((activity) => [`${activity.type}:${activity.sourceId}`, activity.id])
  );

  const countsByActivity = new Map<number, Record<string, number>>();
  for (const group of reactionGroups) {
    const counts = countsByActivity.get(group.activityId) ?? {};
    counts[group.type] = group._count._all;
    countsByActivity.set(group.activityId, counts);
  }

  const userReactionByActivity = new Map(
    userReactions.map((reaction) => [reaction.activityId, reaction.type])
  );

  const activitiesWithReactions = activities.map((activity) => {
    const key = `${activity.sourceType}:${activity.sourceId}`;
    const wallActivityId = wallActivityIdsBySource.get(key);
    const counts = wallActivityId ? countsByActivity.get(wallActivityId) ?? {} : {};

    return {
      ...activity,
      wallActivityId,
      reactionCounts: {
        LIKE: counts.LIKE ?? 0,
        LOVE: counts.LOVE ?? 0,
        LAUGH: counts.LAUGH ?? 0,
        WOW: counts.WOW ?? 0,
        ANGRY: counts.ANGRY ?? 0,
      },
      userReaction: wallActivityId
        ? userReactionByActivity.get(wallActivityId) ?? null
        : null,
    };
  });

  return (
    <CommunityWall
      activities={activitiesWithReactions}
      stats={{ memberCount, teamCount, challengeCount }}
      currentUser={{
        name: currentUser?.name || session.user?.name || 'Skater',
        photo: currentUser?.photo || session.user?.image || null,
      }}
    />
  );
}

function toSafeVideoUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
