# Analytics Work Plan - GA4 + Microsoft Clarity

**Project:** Trickest
**Tools:** Google Analytics 4 (GA4) + Microsoft Clarity
**Created:** 2026-03-11
**Status:** 🟢 Active - Collecting baseline data

---

## 📊 Overview

### **Why Both Tools?**

| **GA4** | **Microsoft Clarity** |
|---------|----------------------|
| The WHAT and WHEN | The WHY and HOW |
| Quantitative metrics | Qualitative behavior |
| Events & conversions | Session recordings |
| Funnels & flows | Heatmaps |
| Demographics | UX problems (dead clicks, rage clicks) |

### **Goal**

Use data-driven insights to improve user experience, increase conversion rates, and optimize the platform for skaters and judges.

---

## 🎯 Week 1: Diagnosis & Baseline

### **Day 1-2: Session Recordings Analysis (Clarity)**

**Objective:** Understand how users actually use the platform

**Actions:**
- [ ] Watch 20-30 session recordings
- [ ] Classify users by type:
  - 🟢 New vs. Returning
  - 🟡 Skaters vs. Judges vs. Admins
  - 🔴 Mobile vs. Desktop
- [ ] Identify patterns:
  - Where do they get stuck?
  - What buttons can't they find?
  - What confuses them?

**Metrics to Track:**
- Time to complete profile
- Incorrect clicks (missed targets)
- Navigation method (menu vs. URL)
- Rage clicks (frustration indicators)

**Document findings in:** `docs/analytics/week1-findings.md`

---

### **Day 3-4: Heatmap Analysis (Clarity)**

**Objective:** Identify visual interaction patterns

**Pages to analyze:**
- [ ] Homepage (`/`)
- [ ] Dashboard (`/dashboard`)
- [ ] Challenges page
- [ ] Leaderboard

**Look for:**
- [ ] 🔥 High interaction zones
- [ ] ❄️ Ignored areas
- [ ] 💀 Dead clicks (clicks that do nothing)
- [ ] 📏 Scroll depth

**Key Questions:**
- Do important CTAs receive clicks?
- Do users see main CTAs?
- Are there elements that look clickable but aren't?

**Screenshot heatmaps and save to:** `docs/analytics/heatmaps/`

---

### **Day 5: Event Analysis (GA4)**

**Objective:** Connect behavior with metrics

**GA4 Navigation:**
```
Reportes → Engagement → Events
```

**Events to check:**
- [ ] `page_view` - Most viewed pages
- [ ] `session_start` - Session count
- [ ] `user_engagement` - Time on site
- [ ] `first_visit` - New users
- [ ] `scroll_tracking` - Scroll depth

**Custom events (if implemented):**
- [ ] `login`
- [ ] `sign_up`
- [ ] `profile_completion_step`
- [ ] `button_clicked`

**Key Questions:**
- What's the most visited page?
- How long do users stay?
- What % complete their profile?

---

### **Day 6-7: Identify Problems & Opportunities**

**Create document:** `docs/analytics/problems-opportunities.md`

**Template:**

```markdown
# Problems & Opportunities - Week 1

## 🔴 Critical Problems
- [ ] Problem 1
  - Evidence: [Clarity/GA4 data]
  - Impact: High/Medium/Low
  - Affected users: X%

- [ ] Problem 2
  - ...

## 🟡 Important Issues
- [ ] Issue 1
  - ...

## 🟢 Opportunities
- [ ] Opportunity 1
  - Evidence: [Data]
  - Potential impact: ...

## 📊 Key Metrics (Baseline)
- Profile completion rate: __%
- Time to first submission: __ days
- Session duration: __ minutes
- Bounce rate: __%
- DAU/MAU: __
```

---

## 🚀 Week 2: Implement Actions

### **Priority 1: Fix Critical Problems**

#### **Example: Dead Clicks in Leaderboard**
```
Problem: Users click on skater names but nothing happens
Evidence: Clarity shows 50+ dead clicks on leaderboard names
Solution:
  1. Add trackProfileViewed event
  2. Make names clickable
  3. Show profile modal
```

**Implementation checklist:**
- [ ] Create profile modal component
- [ ] Add click handler to leaderboard
- [ ] Implement `analytics.trackProfileViewed(userId)`
- [ ] Test in development
- [ ] Deploy to production
- [ ] Monitor for 1 week

---

#### **Example: Rage Clicks on Login Modal**
```
Problem: Users rage-click on login button when modal is already open
Evidence: Clarity shows 20+ rage clicks on login area
Solution:
  1. Improve modal visual feedback
  2. Add entrance animation
  3. Make modal more prominent
```

**Implementation checklist:**
- [ ] Update modal styling
- [ ] Add Framer Motion animation
- [ ] Test animations
- [ ] Deploy and monitor

---

#### **Example: Low Filter Usage**
```
Problem: Search filters in cold zone of heatmap
Evidence: Clarity heatmap shows 0 clicks on filters
Solution:
  1. Move filters to top
  2. Increase visibility (color/size)
  3. Add trackSearch event to measure
```

**Implementation checklist:**
- [ ] Redesign filter layout
- [ ] Implement `analytics.trackSearch(term, results)`
- [ ] A/B test new position
- [ ] Measure filter usage increase

---

### **Priority 2: Implement TrackedButton on Key CTAs**

**Locations to add tracking:**

1. **[ ] Sign Up / Login Buttons (Header)**
   ```typescript
   <TrackedButton
     trackingName="sign_up"
     trackingLocation="header"
     onClick={handleSignUp}
   >
     Sign Up
   </TrackedButton>
   ```

2. **[ ] Complete Profile CTA (Modal)**
   ```typescript
   <TrackedButton
     trackingName="complete_profile"
     trackingLocation="profile_modal"
     onClick={handleCompleteProfile}
   >
     Complete Profile
   </TrackedButton>
   ```

3. **[ ] Submit Video Button (Challenge Modal)**
   ```typescript
   <TrackedButton
     trackingName="submit_video"
     trackingLocation="challenge_modal"
     color="primary"
     onClick={handleSubmitVideo}
   >
     Submit Video
   </TrackedButton>
   ```

4. **[ ] Join Team Button (Team Page)**
   ```typescript
   <TrackedButton
     trackingName="join_team"
     trackingLocation="team_page"
     onClick={handleJoinTeam}
   >
     Join Team
   </TrackedButton>
   ```

5. **[ ] Save Changes Button (Profile)**
   ```typescript
   <TrackedButton
     trackingName="save_profile"
     trackingLocation="profile_settings"
     onClick={handleSaveProfile}
   >
     Save Changes
   </TrackedButton>
   ```

---

### **Priority 3: Add Custom Events**

**Challenge Submission Flow:**
```typescript
// In challenge submission component
import { useAnalytics } from '@/hooks/useAnalytics';

const analytics = useAnalytics();

const handleVideoSubmit = async () => {
  // Track submission attempt
  analytics.trackVideoSubmitted(challengeId, level);

  try {
    await submitVideo(videoData);
    // Track success
    analytics.trackSubmissionEvaluated(submissionId, 0, 'pending');
  } catch (error) {
    // Track error
    analytics.trackError('Video submission failed', 'challenge_form');
  }
};
```

**Judge Evaluation Flow:**
```typescript
// In judge evaluation component
const handleEvaluate = (score: number, feedback: string) => {
  analytics.trackSubmissionEvaluated(
    submissionId,
    score,
    score >= 70 ? 'approved' : 'rejected'
  );

  // Save evaluation...
};
```

**Profile Completion Flow:**
```typescript
// Track each step
const handleStepComplete = (step: number, stepName: string) => {
  analytics.trackProfileCompletionStep(step, stepName);
};

// When profile is complete
const handleProfileComplete = () => {
  analytics.trackProfileCompleted();
};
```

---

## 📈 Week 3: Measure & Optimize

### **Create Funnels in GA4**

**Funnel 1: Sign Up Flow**
```
1. Visit homepage
2. Click sign up
3. Complete registration
4. Complete profile
5. View first challenge
```

**Funnel 2: Video Submission**
```
1. View challenge
2. Click submit video
3. Upload video
4. Submit for review
5. Receive evaluation
```

**Funnel 3: Profile Completion**
```
1. Sign up / Login
2. Start profile completion
3. Complete step 1 (general info)
4. Complete step 2 (dream setup)
5. Complete step 3 (social media)
```

**Setup in GA4:**
```
Explore → Funnel exploration → Create new funnel
```

---

### **A/B Test Ideas**

**Based on Clarity insights:**

#### **Test 1: Profile Completion**
```
Variant A: Current 3-step modal
Variant B: Single-page form with progress bar

Metric: Profile completion rate
Duration: 2 weeks
Sample: 50% of new users
```

#### **Test 2: CTA Button Placement**
```
Variant A: Submit button at bottom
Variant B: Submit button sticky at top

Metric: Video submission rate
Duration: 1 week
```

#### **Test 3: Dashboard Layout**
```
Variant A: Current layout
Variant B: Challenges prioritized at top

Metric: Challenge views
Duration: 2 weeks
```

---

## 🎯 Key Performance Indicators (KPIs)

### **Acquisition Metrics**
- [ ] Conversion rate (visits → sign ups)
- [ ] Traffic sources effectiveness
- [ ] Cost per acquisition (if running ads)

**Targets:**
- Conversion rate: > 5%
- Top 3 sources identified

---

### **Activation Metrics**
- [ ] Profile completion rate
- [ ] Time to first video submission
- [ ] First challenge viewed rate

**Targets:**
- Profile completion: > 80%
- Time to first submission: < 24 hours
- First challenge view: > 90%

---

### **Retention Metrics**
- [ ] DAU/MAU ratio
- [ ] Retention D1, D7, D30
- [ ] Returning user percentage

**Targets:**
- DAU/MAU: > 20%
- D7 Retention: > 40%
- D30 Retention: > 20%

---

### **Engagement Metrics**
- [ ] Videos submitted per user
- [ ] Session duration
- [ ] Pages per session
- [ ] Leaderboard views

**Targets:**
- Videos/user: > 3
- Session duration: > 5 minutes
- Pages/session: > 3

---

## 🔄 Continuous Improvement Cycle

```
1️⃣ CLARITY
   ↓ Watch recordings
   ↓ Identify UX problems

2️⃣ GA4
   ↓ Validate with metrics
   ↓ Quantify impact

3️⃣ IMPLEMENT
   ↓ Make data-driven changes
   ↓ Add event tracking

4️⃣ MEASURE
   ↓ Compare before/after
   ↓ Document results

5️⃣ REPEAT
   🔄 Continuous cycle
```

---

## 📋 Weekly Review Template

**Date:** _____

### **Clarity Insights**
- **Recordings watched:** ___
- **Patterns identified:**
  - [ ]
  - [ ]
- **Heatmaps reviewed:**
  - [ ] Homepage
  - [ ] Dashboard
  - [ ] Other: ___

### **GA4 Metrics**
- **Users:** ___ (vs last week: ___%)
- **Sessions:** ___ (vs last week: ___%)
- **Conversion rate:** ___%
- **Top event:** ___

### **Actions Taken**
- [ ] Action 1 - Result: ___
- [ ] Action 2 - Result: ___

### **Next Week's Focus**
1. [ ]
2. [ ]
3. [ ]

---

## 🚀 Quick Wins (First Month)

### **Week 1: Foundation**
- [ ] Set up baseline metrics
- [ ] Document current state
- [ ] Identify top 3 problems

### **Week 2: Quick Fixes**
- [ ] Fix top 3 critical problems
- [ ] Add TrackedButton to 5 key CTAs
- [ ] Implement basic custom events

### **Week 3: Measurement**
- [ ] Create 3 funnels in GA4
- [ ] Set up custom dashboards
- [ ] Start A/B test #1

### **Week 4: Optimization**
- [ ] Analyze A/B test results
- [ ] Implement winning variant
- [ ] Document learnings
- [ ] Plan next month's tests

---

## 📚 Resources

### **GA4 Resources**
- [GA4 Event Builder](https://ga-devtools.google/ga4/event-builder/)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 Explore](https://support.google.com/analytics/answer/9154377)

### **Microsoft Clarity Resources**
- [Clarity Documentation](https://learn.microsoft.com/en-us/clarity/)
- [Clarity Blog](https://clarity.microsoft.com/blog/)

### **Internal Documentation**
- [Analytics Guide](./ANALYTICS_GUIDE.md)
- [Implementation Examples](../src/lib/analytics.ts)

---

## 📞 Next Steps

**This Week:**
1. [ ] Watch 10 Clarity recordings
2. [ ] Identify 3 obvious problems
3. [ ] Note behavioral patterns

**This Month:**
1. [ ] Implement TrackedButton on 5 CTAs
2. [ ] Add 10 custom events
3. [ ] Create 3 funnels in GA4
4. [ ] Run first A/B test

**This Quarter:**
1. [ ] Improve profile completion by 20%
2. [ ] Increase video submissions by 30%
3. [ ] Reduce bounce rate by 15%
4. [ ] Build data-driven culture

---

**Last Updated:** 2026-03-11
**Next Review:** 2026-03-18
**Status:** 🟢 On Track
