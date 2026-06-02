import type { Prisma } from '@prisma/client';
import prisma from '@/app/lib/prisma';

/**
 * Helper functions to create automatic notifications
 */

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: {
  userId: string; // Email del usuario
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata as Prisma.JsonValue || undefined,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Notification when a judge evaluates a submission
export async function notifySubmissionEvaluated({
  userEmail,
  submissionId,
  challengeName,
  score,
  status,
  judgeEmail,
  judgeName,
}: {
  userEmail: string;
  submissionId: number;
  challengeName: string;
  score: number | null;
  status: 'approved' | 'rejected';
  judgeEmail: string;
  judgeName: string | null;
}) {
  const isApproved = status === 'approved';
  const emoji = isApproved ? '✅' : '❌';
  const action = isApproved ? 'approved' : 'rejected';

  await createNotification({
    userId: userEmail,
    type: 'submission_evaluated',
    title: `${emoji} Evaluation: ${challengeName}`,
    message: `${judgeName || 'A judge'} ${action} your trick${isApproved && score ? ` with ${score} points` : ''}`,
    link: `/dashboard/skaters/tricks`,
    metadata: {
      submissionId,
      challengeName,
      score,
      status,
      judgeEmail,
    },
  });
}

// Notification when someone invites you to a team
export async function notifyTeamInvitation({
  userEmail,
  teamName,
  teamId,
  inviterName,
}: {
  userEmail: string;
  teamName: string;
  teamId: number;
  inviterName: string | null;
}) {
  await createNotification({
    userId: userEmail,
    type: 'team_invitation',
    title: `👥 Team Invitation`,
    message: `${inviterName || 'Someone'} invited you to join "${teamName}"`,
    link: `/dashboard/teams`,
    metadata: {
      teamId,
      teamName,
    },
  });
}

// Notification when your ranking position changes
export async function notifyRankingUpdate({
  userEmail,
  newPosition,
  oldPosition,
  category,
}: {
  userEmail: string;
  newPosition: number;
  oldPosition: number;
  category: 'individual' | 'team';
}) {
  const improved = newPosition < oldPosition;
  const emoji = improved ? '📈' : '📉';
  const action = improved ? 'moved up' : 'moved down';
  const change = Math.abs(newPosition - oldPosition);

  await createNotification({
    userId: userEmail,
    type: 'ranking_update',
    title: `${emoji} Ranking Updated`,
    message: `You ${action} ${change} ${change === 1 ? 'position' : 'positions'} in the ${category === 'team' ? 'team' : 'individual'} ranking. You are now at #${newPosition}`,
    link: `/dashboard/ranking`,
    metadata: {
      newPosition,
      oldPosition,
      category,
    },
  });
}

// Notification when someone follows you
export async function notifyNewFollower({
  userEmail,
  followerEmail,
  followerName,
  followerPhoto,
}: {
  userEmail: string;
  followerEmail: string;
  followerName: string | null;
  followerPhoto: string | null;
}) {
  await createNotification({
    userId: userEmail,
    type: 'new_follower',
    title: `🔔 New Follower`,
    message: `${followerName || 'A skater'} started following you`,
    link: `/profile/${followerEmail}`,
    metadata: {
      followerEmail,
      followerName,
      followerPhoto,
    },
  });
}

// Notification when someone votes on your submission
export async function notifyVoteReceived({
  userEmail,
  challengeName,
  submissionId,
  voteType,
}: {
  userEmail: string;
  challengeName: string;
  submissionId: number;
  voteType: 'upvote' | 'downvote';
}) {
  const emoji = voteType === 'upvote' ? '👍' : '👎';

  await createNotification({
    userId: userEmail,
    type: 'vote_received',
    title: `${emoji} New vote on "${challengeName}"`,
    message: `Your submission received a ${voteType === 'upvote' ? 'positive vote' : 'negative vote'} from the community`,
    link: `/dashboard/skaters/tricks`,
    metadata: {
      submissionId,
      challengeName,
      voteType,
    },
  });
}

// Notification when a submission is approved by the community
export async function notifyCommunityApproved({
  userEmail,
  challengeName,
  submissionId,
  upvotes,
}: {
  userEmail: string;
  challengeName: string;
  submissionId: number;
  upvotes: number;
}) {
  await createNotification({
    userId: userEmail,
    type: 'community_approved',
    title: `🎉 Approved by the community!`,
    message: `Your trick "${challengeName}" was automatically approved with ${upvotes} positive votes`,
    link: `/dashboard/skaters/tricks`,
    metadata: {
      submissionId,
      challengeName,
      upvotes,
    },
  });
}

// Notification when you are accepted into a team
export async function notifyTeamAccepted({
  userEmail,
  teamName,
  teamId,
}: {
  userEmail: string;
  teamName: string;
  teamId: number;
}) {
  await createNotification({
    userId: userEmail,
    type: 'team_accepted',
    title: `🎊 You joined a team!`,
    message: `You are now part of "${teamName}"`,
    link: `/dashboard/teams`,
    metadata: {
      teamId,
      teamName,
    },
  });
}
