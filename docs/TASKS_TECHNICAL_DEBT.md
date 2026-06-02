# Technical Debt & Post-MVP Tasks

> Created: March 5, 2026 | Status: Planning
> Owner: Dev team (coordinate with Felipe before implementing)

---

## 1. Admin Dashboard (currently ~85%)

### Status: API routes created, pending QA from other dev

**What exists:**
- `src/app/[locale]/(routes)/dashboard/admin/page.tsx` — Main dashboard with stats cards (Server Component)
- `src/app/[locale]/(routes)/dashboard/admin/users/page.tsx` — User list with role management, filters, pagination
- `src/app/[locale]/(routes)/dashboard/admin/challenges/page.tsx` — Challenge CRUD with create/edit modal, stats per challenge
- `src/app/[locale]/(routes)/dashboard/admin/submissions/page.tsx` — Submission list with filters, re-evaluate modal
- `src/app/[locale]/(routes)/dashboard/admin/settings/page.tsx` — Platform settings (total levels)
- `src/app/[locale]/(routes)/dashboard/admin/layout.tsx` — Uses DashboardLayout (shared sidebar)

**DUPLICATE FOUND — needs decision:**
- `src/app/[locale]/(routes)/admin/page.tsx` — Standalone admin page (no sidebar), links to `/admin/users`, `/admin/interested`, `/admin/challenges`
- **Decision pending:** Which one stays? Felipe reviewing both at:
  - `http://localhost:3000/en/dashboard/admin` (with sidebar)
  - `http://localhost:3000/en/admin` (standalone)
- **Action:** Once decided, delete the other and update any links

**What's MISSING (blocking):**
The UI pages fetch from API routes that don't exist yet:

| API Route | Used by | Methods needed |
|-----------|---------|----------------|
| `/api/admin/stats` | dashboard/admin/page.tsx | GET — return totalUsers, totalSubmissions, totalChallenges, activeJudges, pendingSubmissions, approvedSubmissions, rejectedSubmissions, skaterCount, judgeCount, adminCount |
| `/api/admin/users` | dashboard/admin/users/page.tsx | GET (list with pagination, role filter), PATCH (updateRole) |
| `/api/admin/users/count` | admin/page.tsx (standalone) | GET — return total count |
| `/api/admin/challenges` | dashboard/admin/challenges/page.tsx | GET (list with stats), POST (create), PATCH (update), DELETE |
| `/api/admin/submissions` | dashboard/admin/submissions/page.tsx | GET (list with pagination, status/challenge/user filters), PATCH (reevaluate) |
| `/api/settings` | dashboard/admin/settings/page.tsx | GET (by key), POST (upsert) |

**Implementation notes:**
- All admin API routes MUST verify admin role server-side (check session + isAdmin())
- Use Prisma singleton from `@/app/lib/prisma` (NOT `new PrismaClient()`)
- AppSettings model already exists in schema for the settings endpoint
- Translations already exist: `adminDashboard`, `adminUsers`, `adminChallengesPage`, `adminSubmissionsPage`, `adminSettingsPage`, `adminPage` namespaces

**Priority:** HIGH — needed for platform management at launch

### PENDING: QA Testing by Other Dev (admin account required)

Test all admin pages logged in as admin. Fill results and return to Felipe.

| # | Test | URL | OK/FAIL | Notes |
|---|------|-----|---------|-------|
| 1 | Dashboard loads with real stats | `/en/dashboard/admin` | | |
| 2 | Users: list loads with photos and roles | `/en/dashboard/admin/users` | | |
| 3 | Users: change user role via dropdown | `/en/dashboard/admin/users` | | |
| 4 | Users: role filter works | `/en/dashboard/admin/users` | | |
| 5 | Users: pagination works | `/en/dashboard/admin/users` | | |
| 6 | Challenges: list loads with stats per challenge | `/en/dashboard/admin/challenges` | | |
| 7 | Challenges: create new challenge | `/en/dashboard/admin/challenges` | | |
| 8 | Challenges: edit existing challenge | `/en/dashboard/admin/challenges` | | |
| 9 | Challenges: delete challenge (no submissions) | `/en/dashboard/admin/challenges` | | |
| 10 | Submissions: list loads with user + challenge info | `/en/dashboard/admin/submissions` | | |
| 11 | Submissions: status filter works | `/en/dashboard/admin/submissions` | | |
| 12 | Submissions: re-evaluate submission (change score) | `/en/dashboard/admin/submissions` | | |
| 13 | Settings: change total levels | `/en/dashboard/admin/settings` | | |

**After QA:** Report results to Felipe. Any FAIL items will be fixed in next session.

---

## 2. Persistent Notifications (currently ~30%)

### Status: Schema exists, basic toast only

**What exists:**
- `Notification` model in Prisma schema (id, userId, type, title, message, link, isRead, metadata, createdAt)
- Toast notifications via react-hot-toast (ephemeral, not persisted)
- `notifications` namespace in translation files

**What's MISSING:**
- API routes for notifications CRUD:
  - `GET /api/notifications` — list user's notifications (paginated, unread count)
  - `PATCH /api/notifications/[id]` — mark as read
  - `PATCH /api/notifications/mark-all-read` — mark all as read
  - `DELETE /api/notifications/[id]` — delete notification
- Notification creation logic (server-side, triggered by events):
  - Submission evaluated (approved/rejected with score)
  - Team invitation received
  - New team member joined
  - New follower
  - Vote received on submission
- UI: Notification bell/dropdown in navbar with unread count badge
- UI: Notifications page with full list

**Priority:** MEDIUM — important for engagement but not blocking launch

---

## 3. Testing (currently 0%)

### Status: No test setup

**What's MISSING:**
- Jest + React Testing Library setup
- Test configuration (jest.config.js, test utilities)
- Priority test targets:
  1. API routes: auth, submissions, evaluations (integration tests)
  2. Auth flow: registration, login, role checks (integration)
  3. Business logic: score calculation, team membership rules (unit)
  4. Components: ChallengeCard, SubmissionHistoryCard (component tests)
- E2E setup with Playwright for critical flows:
  1. Sign up -> complete profile -> submit trick
  2. Judge evaluates submission
  3. Team create -> invite -> join

**Priority:** LOW for launch — implement post-launch for stability

---

## 4. Rate Limiting

### Status: Not implemented

**What's MISSING:**
- Rate limiting middleware for critical endpoints:
  - `POST /api/auth/*` — prevent brute force (5 attempts/minute)
  - `POST /api/submissions` — prevent spam (10/hour per user)
  - `POST /api/interested` — prevent email spam (3/minute per IP)
  - `POST /api/teams` — prevent team spam (5/hour per user)
- Options:
  - **Simple:** In-memory rate limiter (e.g., `next-rate-limit` or custom Map-based)
  - **Production:** Upstash Redis rate limiter (`@upstash/ratelimit`) — works with Vercel serverless
- Consider: Vercel has built-in DDoS protection, so focus on application-level abuse prevention

**Priority:** HIGH — security requirement before launch

---

## 5. Atomic Design Migration

### Status: Partially started

**What exists:**
- `src/components/atoms/` — Button, IconButton, avatar, circle-image, container (started)
- Everything else is flat in `src/components/`

**What's MISSING:**
- Reorganize existing components:
  - **Molecules:** UserScoreBadge, LocationSelector, navbar, LanguageSwitcher
  - **Organisms:** ChallengeCard, SubmissionHistoryCard, Sidebar, all modals (SetPasswordModal, SkateProfileCompletionModal, WelcomeModal, SubmitTrickModal)
  - **Templates:** DashboardLayout, AuthLayout
- Update all import paths after moving
- This is a refactor — zero user-facing impact

**Priority:** LOW — code organization, do incrementally when touching files

---

## 6. Community Voting System (Post-MVP)

### Status: Schema exists, no implementation

**What exists in Prisma schema:**
- `Vote` model (submissionId, userId, voteType: "upvote"/"downvote")
- `Submission` already has voting fields: upvotes, downvotes, voteCount, communityApproved, autoApprovedAt
- Indexes on communityApproved and voteCount

**What's MISSING:**
- API routes:
  - `POST /api/submissions/[id]/vote` — cast vote (upvote/downvote, toggle)
  - `GET /api/submissions/[id]/votes` — get vote stats + user's vote
- Auto-approval logic:
  - Define threshold (e.g., 10 upvotes with >70% positive = auto-approve)
  - Trigger on vote creation: check if threshold met -> update submission status
  - Set communityApproved=true, autoApprovedAt=now()
- UI changes:
  - Vote buttons on submission cards (thumbs up/down with counts)
  - "Community Approved" badge on auto-approved submissions
  - Filter submissions by "most voted" in leaderboard/gallery
- Judge queue optimization:
  - Show highest-voted submissions first to judges
  - Skip auto-approved submissions from judge queue
- Anti-abuse:
  - One vote per user per submission (already enforced by schema @@unique)
  - Minimum profile completion to vote
  - Consider: can't vote on own submissions

**Why this matters:** Currently judges are the bottleneck. With 500+ users submitting and only 3-5 judges, the pending queue will explode. Community voting solves this by:
1. Auto-approving clearly good submissions
2. Prioritizing ambiguous ones for judge review
3. Engaging the community (voters feel involved)

**Priority:** HIGH for post-launch — implement within first 2 weeks after launch

---

## Implementation Order (Recommended)

| Order | Task | Why |
|-------|------|-----|
| 1 | Admin API routes | Unblocks existing UI, needed for platform management |
| 2 | Rate limiting | Security, must have before launch |
| 3 | Community voting | Solves judge bottleneck post-launch |
| 4 | Notifications | Engagement, can add incrementally |
| 5 | Testing | Stability, do post-launch |
| 6 | Atomic Design | Refactor, do incrementally |
