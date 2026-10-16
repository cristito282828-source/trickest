import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';

export const skateLetters = ['S', 'K', 'A', 'T', 'E'] as const;
export const skateGameRadiusMeters = 100;
export const skateGameMaxGpsAccuracyMeters = 100;
export const skateGameCheckInFreshnessMs = 15 * 60_000;

export async function findAccessibleSkateGame(id: number, userEmail: string) {
  return prisma.skateGame.findFirst({
    where: {
      id,
      OR: [{ challengerId: userEmail }, { opponentId: userEmail }, { judgeId: userEmail }],
    },
    include: {
      challenger: { select: { email: true, username: true, name: true, photo: true } },
      opponent: { select: { email: true, username: true, name: true, photo: true } },
      judge: { select: { email: true, username: true, name: true, photo: true } },
      winner: { select: { email: true, username: true, name: true, photo: true } },
      loser: { select: { email: true, username: true, name: true, photo: true } },
      spot: { select: { id: true, name: true, type: true, city: true, latitude: true, longitude: true } },
      turns: {
        orderBy: { turnNumber: 'asc' },
        include: { player: { select: { username: true, name: true, photo: true } } },
      },
      checkIns: {
        include: { user: { select: { email: true, username: true, name: true } } },
      },
      ratings: {
        where: { raterId: userEmail },
        select: { id: true, score: true, comment: true, createdAt: true },
      },
    },
  });
}

export function serializeSkateGame(
  game: NonNullable<Awaited<ReturnType<typeof findAccessibleSkateGame>>>,
  viewerEmail: string
) {
  const userData = ({ email: _email, ...user }: {
    email: string;
    username: string | null;
    name: string | null;
    photo: string | null;
  }) => user;

  return {
    id: game.id,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    challengerAcceptedAt: game.challengerAcceptedAt,
    opponentAcceptedAt: game.opponentAcceptedAt,
    judgeAcceptedAt: game.judgeAcceptedAt,
    startedAt: game.startedAt,
    completedAt: game.completedAt,
    challengerLetters: game.challengerLetters,
    opponentLetters: game.opponentLetters,
    judgeReport: game.judgeReport,
    challenger: userData(game.challenger),
    opponent: userData(game.opponent),
    judge: userData(game.judge),
    winner: game.winner ? userData(game.winner) : null,
    loser: game.loser ? userData(game.loser) : null,
    spot: game.spot ? {
      id: game.spot.id,
      name: game.spot.name,
      type: game.spot.type,
      city: game.spot.city,
    } : null,
    turns: game.turns.map((turn) => ({
      id: turn.id,
      turnNumber: turn.turnNumber,
      attemptedBy: turn.attemptedBy === game.challengerId
        ? userData(game.challenger)
        : userData(game.opponent),
      trickName: turn.trickName,
      landed: turn.landed,
      letterAwardedTo: turn.letterAwardedTo === game.challengerId
        ? userData(game.challenger)
        : turn.letterAwardedTo === game.opponentId
          ? userData(game.opponent)
          : null,
      judgeNote: turn.judgeNote,
      createdAt: turn.createdAt,
    })),
    checkIns: game.checkIns.map((checkIn) => ({
      username: checkIn.user.username,
      name: checkIn.user.name,
      checkedInAt: checkIn.checkedInAt,
      accuracyMeters: checkIn.accuracyMeters,
    })),
    myCheckIn: game.checkIns.some((checkIn) =>
      checkIn.user.email === viewerEmail &&
      Date.now() - checkIn.checkedInAt.getTime() <= skateGameCheckInFreshnessMs
    ),
    myRating: game.ratings[0] ?? null,
    viewerRole: game.challengerId === viewerEmail
      ? 'challenger'
      : game.opponentId === viewerEmail
        ? 'opponent'
        : 'judge',
  };
}

export function nextSkateLetter(current: string) {
  return skateLetters[current.length] ?? null;
}

export function gameCanAccept(status: SkateGameStatus) {
  return status === SkateGameStatus.PENDING_ACCEPTANCE;
}

export function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMeters = 6_371_000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lng2 - lng1);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
