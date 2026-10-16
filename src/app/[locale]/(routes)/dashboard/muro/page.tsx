import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
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

  return (
    <CommunityWall
      activities={activities}
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
