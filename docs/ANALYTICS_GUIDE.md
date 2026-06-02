# Analytics Implementation Guide

## 📊 Overview

Trickest now has **Google Analytics 4 (GA4)** and **Microsoft Clarity** integration for comprehensive user behavior tracking.

### Tools Implemented:

1. **Google Analytics 4 (GA4)** - Event tracking, funnels, user analysis
2. **Microsoft Clarity** - Heatmaps, session recordings, dead/rage clicks (FREE)
3. **Custom Event Tracking** - Tailored events for Trickest platform

---

## 🚀 Setup

### Environment Variables

Add these to your `.env` and Vercel environment variables:

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-NE64BNV2BB

# Microsoft Clarity (Get yours at: https://clarity.microsoft.com/)
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id_here
```

---

## 📝 Usage Examples

### 1. **Using the `useAnalytics` Hook**

```typescript
'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

export default function MyComponent() {
  const analytics = useAnalytics();

  const handleSubmit = () => {
    // Track event
    analytics.trackVideoSubmitted('challenge_1', 3);
  };

  return <button onClick={handleSubmit}>Submit Video</button>;
}
```

### 2. **Using TrackedButton Component**

```typescript
import TrackedButton from '@/components/TrackedButton';

// Button with automatic click tracking
<TrackedButton
  trackingName="submit_video"
  trackingLocation="challenge_modal"
  color="primary"
  onClick={handleSubmit}
>
  Submit Video
</TrackedButton>
```

### 3. **Using Analytics Functions Directly**

```typescript
import { trackSignUp, trackChallengeViewed } from '@/lib/analytics';

// Track sign up
trackSignUp('Google');

// Track challenge view
trackChallengeViewed('challenge_1', 3);
```

---

## 🎯 Available Events

### Authentication Events

```typescript
// When user signs up
trackSignUp('Google' | 'Email');

// When user logs in
trackLogin('Google' | 'Email');

// When user logs out
trackLogout();
```

### Onboarding Events

```typescript
// Track each step of profile completion
trackProfileCompletionStep(1, 'general_info');
trackProfileCompletionStep(2, 'dream_setup');
trackProfileCompletionStep(3, 'social_media');

// When profile is complete
trackProfileCompleted();
```

### Challenge Events

```typescript
// User views a challenge
trackChallengeViewed('challenge_1', 3); // id, level

// User submits a video
trackVideoSubmitted('challenge_1', 3);

// Judge evaluates submission
trackSubmissionEvaluated('submission_123', 85, 'approved');
```

### Team Events

```typescript
// User creates a team
trackTeamCreated(5); // team size

// User joins a team
trackTeamJoined('team_123');
```

### Engagement Events

```typescript
// Track button clicks
trackButtonClicked('save_profile', 'profile_modal');

// Track video plays
trackVideoPlayed('demo' | 'submission');

// Track leaderboard views
trackLeaderboardViewed('all' | 'teams' | 'individual');

// Track profile views
trackProfileViewed('user_123');
```

### Navigation & Search

```typescript
// Track navigation clicks
trackNavigationClick('/dashboard', 'sidebar');

// Track searches
trackSearch('ollie challenge', 5);
```

### Social Sharing

```typescript
trackShare('challenge', 'instagram', 'challenge_1');
trackShare('profile', 'twitter', 'user_123');
```

### Error Tracking

```typescript
trackError('Video upload failed', 'submission_form');
```

---

## 🔥 Heatmaps & Session Recordings

### Microsoft Clarity Setup

1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Create a new project
3. Copy your **Project ID**
4. Add to environment variables: `NEXT_PUBLIC_CLARITY_PROJECT_ID`
5. Add to Vercel environment variables

### What Clarity Tracks Automatically:

- ✅ **Heatmaps** - Where users click and scroll
- ✅ **Session Recordings** - Watch user sessions
- ✅ **Dead Clicks** - Clicks that don't do anything
- ✅ **Rage Clicks** - Frustrated users clicking repeatedly
- ✅ **Scroll Depth** - How far users scroll
- ✅ **JavaScript Errors** - Automatic error tracking

---

## 📊 Viewing Analytics

### Google Analytics 4

1. Go to [https://analytics.google.com/](https://analytics.google.com/)
2. Select your property (G-NE64BNV2BB)
3. Navigate to:
   - **Realtime** - See current users
   - **Reports → Engagement → Events** - See all events
   - **Explore** - Create funnels and path analysis
   - **Configure → Events** - See custom events

### Microsoft Clarity

1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Select your project
3. View:
   - **Heatmaps** - Visual click and scroll maps
   - **Recordings** - Session recordings
   - **Insights** - Dead clicks, rage clicks, errors

---

## 🎯 Recommended Events for Trickest

### High Priority Events

1. **Sign up** - Track new user acquisition
2. **Profile completion** - Track onboarding drop-offs
3. **Video submitted** - Core platform action
4. **Submission evaluated** - Judge interaction
5. **Challenge viewed** - Content engagement

### Medium Priority Events

6. **Button clicks** - UI interaction analysis
7. **Navigation clicks** - User flow understanding
8. **Video played** - Content consumption
9. **Team created/joined** - Social features
10. **Leaderboard viewed** - Gamification engagement

### Low Priority Events

11. **Profile viewed** - Social interaction
12. **Share** - Viral loop tracking
13. **Search** - User intent understanding

---

## 🔧 Custom Event Examples

### Track Specific User Actions

```typescript
// Example: Track when user completes first challenge
const handleFirstChallenge = () => {
  trackEvent('first_challenge_completed', {
    challenge_id: 'challenge_1',
    time_to_complete: 3600, // seconds
    attempts: 3
  });
};

// Example: Track when user earns badge
const handleBadgeEarned = (badgeId: string, badgeName: string) => {
  trackEvent('badge_earned', {
    badge_id: badgeId,
    badge_name: badgeName,
    timestamp: new Date().toISOString()
  });
};

// Example: Track subscription/future feature
const handleSubscription = (plan: string) => {
  trackEvent('subscription_started', {
    plan_type: plan,
    value: 9.99,
    currency: 'USD'
  });
};
```

---

## 📈 Key Metrics to Track

### Acquisition Metrics
- New users (sign_up event)
- Traffic sources (UTM parameters)
- Conversion rate (sign up / page views)

### Activation Metrics
- Profile completion rate
- First video submission rate
- Time to first value

### Engagement Metrics
- Daily active users (DAU)
- Videos submitted per user
- Session duration
- Pages per session

### Retention Metrics
- User retention (D1, D7, D30)
- Churn rate
- Returning user percentage

### Revenue Metrics (future)
- Subscription starts
- In-app purchases
- Lifetime value (LTV)

---

## 🎨 Best Practices

1. **Event Naming**: Use snake_case for event names
   - ✅ `video_submitted`
   - ❌ `videoSubmitted`

2. **Parameter Naming**: Use snake_case for parameters
   - ✅ `challenge_id`
   - ❌ `challengeId`

3. **Be Specific**: Include relevant context
   - ✅ `trackButtonClicked('submit_video', 'challenge_modal')`
   - ❌ `trackButtonClicked('click')`

4. **Don't Track PII**: Never send personal information
   - ✅ `user_id: "123"`
   - ❌ `email: "user@example.com"`

5. **Test Events**: Check DebugView in GA4
   - Enable debug mode: `debug_mode: true`
   - View in: Configure → DebugView

---

## 🆚 GA4 vs Universal Analytics

| Feature | Universal Analytics | GA4 |
|---------|-------------------|-----|
| Session-based | ✅ | ❌ |
| Event-based | ❌ | ✅ |
| Custom Dimensions | Limited | ✅ Unlimited |
| BigQuery Export | Paid only | ✅ Free |
| Predictive Metrics | ❌ | ✅ |
| Cross-platform | Separate | ✅ Unified |

---

## 📚 Resources

- [GA4 Event Builder](https://ga-devtools.google/ga4/event-builder/)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Microsoft Clarity Docs](https://learn.microsoft.com/en-us/clarity/)
- [GA4 Explore](https://support.google.com/analytics/answer/9154377)

---

## 🚀 Next Steps

1. ✅ Set up Microsoft Clarity project
2. ✅ Add `NEXT_PUBLIC_CLARITY_PROJECT_ID` to Vercel
3. ⬜ Add `TrackedButton` to key CTAs
4. ⬜ Add `useAnalytics` to dashboard components
5. ⬜ Create custom funnels in GA4 Explore
6. ⬜ Set up conversion events
7. ⬜ Review heatmaps weekly

---

**Last Updated**: 2026-03-11
**Analytics Version**: GA4 + Microsoft Clarity
