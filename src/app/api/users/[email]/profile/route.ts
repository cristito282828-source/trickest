import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const user = await prisma.user.findUnique({
      where: { email: decodedEmail },
      select: {
        email: true,
        name: true,
        photo: true,
        ciudad: true,
        departamento: true,
        estado: true,
        role: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        socials: {
          select: {
            instagram: true,
            tiktok: true,
            twitter: true,
            facebook: true,
          },
        },
        WishSkate: {
          select: {
            madero: true,
            trucks: true,
            ruedas: true,
            rodamientos: true,
            tenis: true,
          },
        },
        submissions: {
          select: {
            id: true,
            score: true,
            status: true,
            submittedAt: true,
            challenge: {
              select: {
                name: true,
                difficulty: true,
                points: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate advanced stats
    const totalScore = user.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
    const challengesCompleted = user.submissions.length;
    const approvedSubmissions = user.submissions.filter(sub => sub.status === 'approved').length;
    const rejectedSubmissions = user.submissions.filter(sub => sub.status === 'rejected').length;
    const pendingSubmissions = user.submissions.filter(sub => sub.status === 'pending').length;

    // Calculate streaks
    const approvedDates = user.submissions
      .filter(sub => sub.status === 'approved')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map(sub => new Date(sub.submittedAt).toDateString());

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < approvedDates.length; i++) {
      if (i === 0 || approvedDates[i] === approvedDates[i - 1]) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    currentStreak = tempStreak;

    // Calculate difficulty stats
    const difficultyStats = {
      easy: { completed: 0, avgScore: 0, totalScore: 0 },
      medium: { completed: 0, avgScore: 0, totalScore: 0 },
      hard: { completed: 0, avgScore: 0, totalScore: 0 },
      expert: { completed: 0, avgScore: 0, totalScore: 0 },
    };

    user.submissions.forEach(sub => {
      if (sub.status === 'approved') {
        const diff = sub.challenge.difficulty as keyof typeof difficultyStats;
        if (difficultyStats[diff]) {
          difficultyStats[diff].completed++;
          difficultyStats[diff].totalScore += sub.score || 0;
        }
      }
    });

    // Calculate averages
    Object.keys(difficultyStats).forEach(diff => {
      const d = diff as keyof typeof difficultyStats;
      if (difficultyStats[d].completed > 0) {
        difficultyStats[d].avgScore = Math.round(difficultyStats[d].totalScore / difficultyStats[d].completed);
      }
    });

    // Success rate
    const successRate = user.submissions.length > 0
      ? Math.round((approvedSubmissions / user.submissions.length) * 100)
      : 0;

    // Recent activity (last 10 submissions)
    const recentActivity = user.submissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(sub => ({
        type: 'submission',
        challengeName: sub.challenge.name,
        difficulty: sub.challenge.difficulty,
        status: sub.status,
        score: sub.score,
        date: sub.submittedAt,
      }));

    // Achievements system (simplified for now - can be expanded)
    const achievements = [
      {
        id: 'first_blood',
        name: 'FIRST BLOOD',
        description: 'Submit your first submission',
        icon: '🩸',
        category: 'principiante',
        rarity: 'common',
        xp: 25,
        unlocked: user.submissions.length > 0,
        unlockedDate: user.submissions.length > 0 ? user.submissions[0]?.submittedAt : null,
      },
      {
        id: 'approved',
        name: 'APPROVED!',
        description: 'First approved submission',
        icon: '✅',
        category: 'principiante',
        rarity: 'common',
        xp: 50,
        unlocked: approvedSubmissions > 0,
        unlockedDate: approvedSubmissions > 0 ? user.submissions.find(s => s.status === 'approved')?.submittedAt : null,
      },
      {
        id: 'score_100',
        name: 'CENTURY CLUB',
        description: 'Reach 100 total points',
        icon: '💯',
        category: 'intermedio',
        rarity: 'uncommon',
        xp: 100,
        unlocked: totalScore >= 100,
        unlockedDate: totalScore >= 100 ? new Date().toISOString() : null,
      },
      {
        id: 'streak_master',
        name: 'STREAK MASTER',
        description: '5 approved submissions in a row',
        icon: '🔥',
        category: 'intermedio',
        rarity: 'rare',
        xp: 150,
        unlocked: bestStreak >= 5,
        unlockedDate: bestStreak >= 5 ? new Date().toISOString() : null,
      },
      {
        id: 'perfect_score',
        name: 'PERFECT SCORE',
        description: 'Get 100 points in a challenge',
        icon: '🎯',
        category: 'avanzado',
        rarity: 'epic',
        xp: 200,
        unlocked: user.submissions.some(sub => sub.score === 100),
        unlockedDate: user.submissions.find(sub => sub.score === 100)?.submittedAt || null,
      },
    ];

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const totalXP = unlockedAchievements.reduce((acc, a) => acc + (a.xp || 50), 0);

    // Build location string from ciudad, departamento, estado
    const locationParts = [user.ciudad, user.departamento, user.estado].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : null;

    // Get the first social media record (if any)
    const socialMedia = user.socials.length > 0 ? user.socials[0] : null;

    // Get follower/following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: decodedEmail } }),
      prisma.follow.count({ where: { followerId: decodedEmail } })
    ]);

    // Check if current user is following this profile (if authenticated)
    let isFollowing = false;
    // For now, we'll set this to false and handle it on the client side
    // In a production app, you'd use proper session validation here

    // Format response - exclude sensitive data
    const publicProfile = {
      email: user.email,
      name: user.name,
      photo: user.photo,
      location,
      role: user.role,
      memberSince: user.createdAt,
      team: user.team,
      socialMedia,
      skateSetup: user.WishSkate,
      stats: {
        totalScore,
        challengesCompleted,
        submissionsApproved: approvedSubmissions,
        submissionsRejected: rejectedSubmissions,
        submissionsPending: pendingSubmissions,
        successRate,
        currentStreak,
        bestStreak,
        highestDifficulty: Math.max(...user.submissions.map(s => {
          const levels = { easy: 1, medium: 2, hard: 3, expert: 4 };
          return levels[s.challenge.difficulty as keyof typeof levels] || 0;
        }), 0),
        difficultyStats,
        totalXP,
        achievementsUnlocked: unlockedAchievements.length,
        totalAchievements: achievements.length,
      },
      achievements: unlockedAchievements.slice(0, 8), // Show top 8 achievements
      recentActivity,
      activitySummary: {
        thisMonth: user.submissions.filter(s =>
          new Date(s.submittedAt).getMonth() === new Date().getMonth() &&
          new Date(s.submittedAt).getFullYear() === new Date().getFullYear()
        ).length,
        thisWeek: user.submissions.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.submittedAt) > weekAgo;
        }).length,
        lastSubmission: user.submissions.length > 0 ?
          user.submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0].submittedAt :
          null,
      },
      socialStats: {
        followerCount,
        followingCount,
        isFollowing,
      },
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { error: 'Error fetching profile' },
      { status: 500 }
    );
  }
}
