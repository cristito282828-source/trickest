# Dynamic Challenges System - Technical Specification

**Project:** Trickest
**Created:** 2026-03-12
**Status:** 🟡 In Development
**Phase:** MVP - Community Milestones

---

## 🎯 Overview

Dynamic challenges that unlock automatically based on community progress, creating engagement and gamification.

### **Goal**

Increase user engagement by:
- Creating community goals
- Rewarding collective progress
- Generating excitement with unlockable content
- Encouraging viral growth

---

## 🚀 Challenge Types

### **Phase 1: Community Milestones (MVP)** ✅

Automatic unlock when thresholds are reached:
- User count milestones (100, 500, 1000 users)
- Video submission milestones (100, 500, 1000 videos)
- Evaluation milestones (50, 200, 500 evaluations)

**Example:**
```
When 100 users register → Unlock "Ollie Master" challenge
When 500 videos submitted → Unlock "Kickflip King" bonus level
```

---

### **Phase 2: Community Goals (Future)**

Community works together toward a common goal:
- "50 skaters must submit ollie videos this week"
- "200 evaluations needed to unlock bonus level"

**Features:**
- Real-time progress bar
- Community leaderboard
- Collective rewards

---

### **Phase 3: Head-to-Head Battles (Future)**

Direct competition between skaters:
- 1v1 battles
- Community voting
- Tournament brackets

---

### **Phase 4: Chain Challenges (Future)**

Skater nominates next skater:
- Time-limited challenges
- Viral potential
- Badge system

---

### **Phase 5: Seasonal/Event Challenges (Future)**

Time-limited themed challenges:
- Monthly challenges
- Holiday specials
- Pro skater events

---

## 📊 Database Schema

### **New Models**

```prisma
// Dynamic Challenge
model DynamicChallenge {
  id              String            @id @default(cuid())
  name            String
  description     String
  type            ChallengeType

  // Trigger configuration
  triggerType     TriggerType
  triggerValue    Int

  // Progress tracking
  currentCount    Int               @default(0)
  targetCount     Int

  // Timestamps
  startDate       DateTime?
  endDate         DateTime?
  unlockedAt      DateTime?

  // Rewards
  points          Int               @default(0)
  badgeId         String?

  // Status
  status          ChallengeStatus   @default(PENDING)

  // Relations
  submissions     Submission[]
  rewards         UserReward[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

// User Rewards for completing dynamic challenges
model UserReward {
  id              String            @id @default(cuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id])

  challengeId     String
  challenge       DynamicChallenge  @relation(fields: [challengeId], references: [id])

  pointsEarned    Int
  badgeEarned     Boolean           @default(false)

  claimedAt       DateTime          @default(now())

  createdAt       DateTime          @default(now())

  @@unique([userId, challengeId])
}

// Update User model to include rewards
model User {
  // ... existing fields
  rewards         UserReward[]
  totalRewardPoints Int             @default(0)
}

// Enums
enum ChallengeType {
  COMMUNITY_MILESTONE    // Auto-unlock at threshold
  COMMUNITY_GOAL         // Collective target
  HEAD_TO_HEAD          // 1v1 battles
  CHAIN                 // Nomination chain
  SEASONAL              // Time-limited events
  LIVE_EVENT            // Stream-based
  COLLABORATION         // Team challenges
  LOCATION              // Geo-specific
  PROGRESSIVE           // Multi-stage
}

enum TriggerType {
  USER_COUNT            // Number of registered users
  VIDEO_COUNT           // Number of video submissions
  EVALUATION_COUNT      // Number of evaluations
  MANUAL                // Admin triggered
  SCHEDULED             // Time-based
}

enum ChallengeStatus {
  PENDING               // Not yet unlocked
  ACTIVE                // Unlocked and accepting submissions
  COMPLETED             // Challenge ended
  EXPIRED               // Time limit reached
}
```

---

## 🔧 API Endpoints

### **Public Endpoints**

```typescript
// GET /api/dynamic-challenges
// Get all visible dynamic challenges
Response: {
  active: DynamicChallenge[],
  upcoming: DynamicChallenge[],
  completed: DynamicChallenge[]
}

// GET /api/dynamic-challenges/[id]
// Get specific challenge details
Response: DynamicChallenge + progress

// GET /api/dynamic-challenges/progress
// Get overall community progress
Response: {
  userCount: number,
  videoCount: number,
  evaluationCount: number,
  nextMilestone: {
    type: string,
    current: number,
    target: number,
    percentage: number
  }
}
```

### **Admin Endpoints**

```typescript
// POST /api/admin/dynamic-challenges
// Create new dynamic challenge
Body: {
  name: string,
  description: string,
  type: ChallengeType,
  triggerType: TriggerType,
  triggerValue: number,
  points: number,
  badgeId?: string,
  startDate?: DateTime,
  endDate?: DateTime
}

// PUT /api/admin/dynamic-challenges/[id]
// Update challenge

// DELETE /api/admin/dynamic-challenges/[id]
// Delete challenge

// POST /api/admin/dynamic-challenges/[id]/unlock
// Manually unlock a challenge
```

---

## 🔄 Cron Jobs

### **Check Community Milestones**

Runs every hour to check if milestones are reached:

```typescript
// File: /app/api/cron/check-milestones/route.ts

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all pending dynamic challenges
  const pendingChallenges = await prisma.dynamicChallenge.findMany({
    where: {
      status: 'PENDING',
      type: 'COMMUNITY_MILESTONE'
    }
  });

  for (const challenge of pendingChallenges) {
    const currentCount = await getCurrentCount(challenge.triggerType);

    if (currentCount >= challenge.triggerValue) {
      await unlockChallenge(challenge);
    }
  }

  return NextResponse.json({ success: true });
}

async function getCurrentCount(triggerType: TriggerType): Promise<number> {
  switch (triggerType) {
    case 'USER_COUNT':
      return await prisma.user.count();
    case 'VIDEO_COUNT':
      return await prisma.submission.count();
    case 'EVALUATION_COUNT':
      return await prisma.submission.count({
        where: { status: { in: ['approved', 'rejected'] } }
      });
    default:
      return 0;
  }
}

async function unlockChallenge(challenge: DynamicChallenge) {
  await prisma.dynamicChallenge.update({
    where: { id: challenge.id },
    data: {
      status: 'ACTIVE',
      unlockedAt: new Date(),
      currentCount: challenge.triggerValue
    }
  });

  // Notify all users
  await notifyChallengeUnlocked(challenge);
}
```

---

## 📱 UI Components

### **Community Progress Banner**

```typescript
// src/components/CommunityProgress.tsx

interface CommunityProgressProps {
  milestone: {
    type: string;
    current: number;
    target: number;
    percentage: number;
    nextChallenge?: string;
  };
}

export default function CommunityProgress({ milestone }: CommunityProgressProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">
          🎯 {milestone.type} Progress
        </h3>
        <span className="text-white font-bold">
          {milestone.percentage}%
        </span>
      </div>

      <div className="w-full bg-white/20 rounded-full h-3 mb-2">
        <div
          className="bg-white h-3 rounded-full transition-all"
          style={{ width: `${milestone.percentage}%` }}
        />
      </div>

      <p className="text-white text-sm">
        {milestone.current} / {milestone.target} {milestone.type.toLowerCase()}
        {milestone.nextChallenge && (
          <span className="ml-2">
            → Unlocks: {milestone.nextChallenge}
          </span>
        )}
      </p>
    </div>
  );
}
```

### **Challenge Unlocked Modal**

```typescript
// src/components/ChallengeUnlockedModal.tsx

interface ChallengeUnlockedModalProps {
  challenge: DynamicChallenge;
  onClose: () => void;
}

export default function ChallengeUnlockedModal({ challenge, onClose }: ChallengeUnlockedModalProps) {
  return (
    <Modal isOpen={!!challenge} onClose={onClose}>
      <div className="text-center">
        <div className="text-6xl mb-4">🔥</div>
        <h2 className="text-2xl font-black uppercase mb-2">
          New Challenge Unlocked!
        </h2>
        <h3 className="text-xl text-accent-cyan-500 mb-4">
          {challenge.name}
        </h3>
        <p className="mb-4">{challenge.description}</p>

        {challenge.points > 0 && (
          <div className="text-2xl font-bold text-accent-purple-500 mb-4">
            +{challenge.points} points
          </div>
        )}

        <Button
          color="primary"
          size="lg"
          onClick={() => router.push(`/challenges/${challenge.id}`)}
        >
          View Challenge
        </Button>
      </div>
    </Modal>
  );
}
```

---

## 🎯 MVP Implementation Plan

### **Sprint 1: Core Infrastructure**
- [ ] Create Prisma migration for dynamic challenges
- [ ] Set up cron job for checking milestones
- [ ] Create API endpoints
- [ ] Basic UI components

### **Sprint 2: First Challenge**
- [ ] Create "100 Users" milestone challenge
- [ ] Implement unlock notification
- [ ] Add progress banner to homepage
- [ ] Test milestone unlock

### **Sprint 3: Refinement**
- [ ] Add user rewards system
- [ ] Create admin dashboard for challenges
- [ ] Add analytics tracking
- [ ] Polish UI/UX

---

## 📋 First Challenge: "Community Builder"

### **Specification**

```typescript
const firstChallenge: DynamicChallenge = {
  name: "Community Builder",
  description: "Help us reach 100 skaters! Submit your first video to unlock exclusive challenges.",
  type: ChallengeType.COMMUNITY_MILESTONE,
  triggerType: TriggerType.USER_COUNT,
  triggerValue: 100,
  points: 50,
  badgeId: "community_builder",
  currentCount: 0,
  targetCount: 100
};
```

### **Reward**
- **Points:** 50 bonus points for all users
- **Badge:** "Community Builder" 🏆
- **Unlock:** Next milestone challenge

---

## 📈 Success Metrics

### **Community Goals**
- Increase user registrations by 20%
- Achieve first milestone in 30 days
- 70% of users submit at least one video

### **Engagement Goals**
- Daily active users increase by 15%
- Session duration increase by 20%
- Social shares increase by 30%

---

## 🔔 Notification System

### **Challenge Unlocked**

```typescript
interface ChallengeNotification {
  type: 'CHALLENGE_UNLOCKED';
  challenge: {
    name: string;
    description: string;
    points: number;
    actionUrl: string;
  };
  channels: ('email' | 'in_app' | 'push')[];
}
```

### **Progress Updates**

```typescript
interface ProgressNotification {
  type: 'MILESTONE_PROGRESS';
  progress: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  };
  channels: ('in_app')[];
}
```

---

## 🛠️ Technical Considerations

### **Performance**
- Cache milestone counts (Redis recommended)
- Update progress every minute, not every page view
- Use database indexes for counts

### **Scalability**
- Batch notifications (don't send all at once)
- Queue email sends (background job)
- Rate limit API calls

### **Security**
- Verify cron secret
- Validate challenge creation (admin only)
- Rate limit challenge submissions

---

## 📚 Related Documentation

- [Analytics Work Plan](./ANALYTICS_WORKPLAN.md)
- [Analytics Guide](./ANALYTICS_GUIDE.md)
- [Design System](./DESIGN_SYSTEM.md)

---

**Last Updated:** 2026-03-12
**Next Review:** After MVP implementation
**Status:** 🟡 Ready for Development
