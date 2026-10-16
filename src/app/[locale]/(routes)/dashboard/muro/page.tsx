import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { WallActivityType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import CommunityWall from '@/components/CommunityWall';
import { graphqlFetch } from '@/lib/woocommerce/graphql-client';
import {
  RECENT_PRODUCTS_BY_CATEGORY_ID_QUERY,
  RECENT_PRODUCTS_QUERY,
} from '@/lib/woocommerce/queries';
import type { ExternalProduct } from '@/lib/woocommerce/types';

export const dynamic = 'force-dynamic';

const PRODUCT_ACTIVITY_WINDOW_DAYS = 30;
const FEATURED_CATEGORY = process.env.WC_FEATURED_CATEGORY || 'trickest';
const FEATURED_CATEGORY_IS_NUMERIC = /^\d+$/.test(FEATURED_CATEGORY);

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
    productsData,
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
      select: { id: true, name: true, imageUrl: true, level: true, points: true, createdAt: true },
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
    FEATURED_CATEGORY_IS_NUMERIC
      ? graphqlFetch<{ products: { nodes: ExternalProduct[] } }>(
          RECENT_PRODUCTS_BY_CATEGORY_ID_QUERY,
          { categoryId: Number(FEATURED_CATEGORY), first: 20 },
          3600
        )
      : graphqlFetch<{ products: { nodes: ExternalProduct[] } }>(
          RECENT_PRODUCTS_QUERY,
          { category: FEATURED_CATEGORY, first: 20 },
          3600
        ),
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
  const productCutoff = Date.now() - PRODUCT_ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentProducts = (productsData?.products?.nodes ?? []).flatMap((product) => {
    if (!Number.isInteger(product.databaseId) || product.databaseId <= 0 || !product.date) return [];
    const publishedAt = new Date(product.date);
    if (
      !Number.isFinite(publishedAt.getTime()) ||
      publishedAt.getTime() < productCutoff ||
      publishedAt.getTime() > Date.now()
    ) return [];
    return [{ product, createdAt: publishedAt.toISOString() }];
  });

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
      actor: { name: 'Trickest', photo: '/logo-icon.png', username: null, isOfficial: true },
      titleName: challenge.name,
      image: challenge.imageUrl,
      level: challenge.level,
      points: challenge.points,
    })),
    ...recentProducts.map(({ product, createdAt }) => ({
      id: `product-${product.databaseId}`,
      sourceType: WallActivityType.PRODUCT_ADDED,
      sourceId: product.databaseId,
      type: 'product_added' as const,
      createdAt,
      actor: { name: 'Trickest', photo: '/logo-icon.png', username: null, isOfficial: true },
      titleName: product.name,
      image: product.image?.sourceUrl || null,
      productUrl: `https://toryskateshop.com/?product=${encodeURIComponent(product.slug)}`,
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
  const [reactionGroups, userReactions, commentGroups] = activityIds.length
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
        prisma.wallComment.groupBy({
          by: ['activityId'],
          where: { activityId: { in: activityIds } },
          _count: { _all: true },
        }),
      ])
    : [[], [], []];

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
  const commentCountsByActivity = new Map(
    commentGroups.map((group) => [group.activityId, group._count._all])
  );

  const activitiesWithReactions = activities.map((activity) => {
    const key = `${activity.sourceType}:${activity.sourceId}`;
    const wallActivityId = wallActivityIdsBySource.get(key);
    const counts = wallActivityId ? countsByActivity.get(wallActivityId) ?? {} : {};

    return {
      ...activity,
      wallActivityId,
      commentCount: wallActivityId ? commentCountsByActivity.get(wallActivityId) ?? 0 : 0,
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
