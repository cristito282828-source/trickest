/**
 * Script para crear el primer desafío dinámico
 * Run: node scripts/create-first-challenge.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstChallenge() {
  try {
    console.log('🚀 Creating first dynamic challenge...');

    // Check if challenge already exists
    const existing = await prisma.dynamicChallenge.findFirst({
      where: {
        name: 'Community Builder'
      }
    });

    if (existing) {
      console.log('⚠️ Challenge already exists, skipping creation');
      console.log('Existing challenge:', existing);
      return;
    }

    // Get current user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    // Create the challenge
    const challenge = await prisma.dynamicChallenge.create({
      data: {
        name: 'Community Builder',
        description: 'Help us build our skater community! Reach 100 registered skaters to unlock exclusive challenges and rewards.',
        type: 'COMMUNITY_MILESTONE',
        triggerType: 'USER_COUNT',
        triggerValue: 100,
        targetCount: 100,
        currentCount: userCount,
        points: 50,
        badgeId: 'community_builder',
        status: 'PENDING'
      }
    });

    console.log('✅ Challenge created successfully!');
    console.log('Challenge details:', {
      id: challenge.id,
      name: challenge.name,
      type: challenge.type,
      trigger: `${challenge.triggerType}: ${challenge.triggerValue}`,
      points: challenge.points,
      currentProgress: `${challenge.currentCount}/${challenge.targetCount}`
    });

    console.log('\n📝 Next steps:');
    console.log('1. Set up cron job to check milestones: /api/cron/check-milestones');
    console.log('2. Add CommunityProgress component to homepage');
    console.log('3. Create notification system for challenge unlocks');
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstChallenge();
