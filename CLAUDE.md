# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trickest is a skateboarding challenge platform built with Next.js 14, where skaters submit video submissions of tricks for different difficulty levels, and judges evaluate them. The platform includes user authentication (Google OAuth + credentials), profile management, team features, and a scoring system.

### Project Type & Use Cases

**Platform Category:** Competition/Challenge Platform with User-Generated Content (Videos)

**Core User Flows:**
1. **Skater Journey:**
   - Sign up via Google OAuth or email/password
   - Complete profile (password, personal info, skate preferences, social media)
   - Browse challenges (10 difficulty levels + bonus)
   - Submit video evidence of completed tricks
   - Track submission status (pending → approved/rejected)
   - View scores and feedback from judges
   - Compete on leaderboards
   - Join/manage teams

2. **Judge Journey:**
   - Access judge dashboard (requires judge role)
   - Review pending submissions with video playback
   - Evaluate technique, execution, style
   - Assign scores (0-100) with written feedback
   - Approve or reject submissions
   - Can also participate as skater

3. **Admin Journey:**
   - Same as judge + ownership privileges
   - Manage challenges, users, teams (future)

**Key Technical Challenges:**
- Video hosting and playback (currently YouTube embeds for demos, need solution for submissions)
- Real-time score updates and leaderboards
- Role-based access control (3 roles: skater, judge, admin)
- Multi-step profile completion with state management
- Social features (teams, leaderboards, profiles)
- Mobile-responsive video recording/upload flow

**Business Logic:**
- Points system based on challenge difficulty
- Scoring algorithm (0-100 per submission)
- Team scoring aggregation
- Achievement/badge system (future)
- Anti-cheat measures (video verification)

## Documentation

This project includes comprehensive documentation in the `/docs` folder:

- **`DESIGN_SYSTEM.md`** - Complete design system guide including:
  - Visual style and aesthetic principles (arcade retro-futurista)
  - Color palette with hex codes and usage guidelines
  - Typography conventions
  - Component patterns and examples (modals, buttons, cards, inputs, tabs)
  - Gradients and glow effects
  - Animations and transitions
  - Accessibility considerations
  - Responsive design patterns
  - Tips de uso (jerarquía visual, estados interactivos, contraste)
  - Export para diseñadores (Figma/Sketch, CSS variables)

**When to reference:**
- Creating new UI components → Check `DESIGN_SYSTEM.md` for patterns
- Choosing colors → Check color sections in `DESIGN_SYSTEM.md`
- Styling decisions → Follow arcade/retro-futurista aesthetic
- Responsive design → Reference breakpoint patterns in design docs
- Export to design tools → Use "Export para Diseñadores" section

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma generate           # Generate Prisma Client (runs automatically on postinstall)
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply migrations in production
npx prisma db push            # Push schema changes without migration
npx prisma studio             # Open Prisma Studio GUI
npm run seed                  # Seed database with test data (creates admin, judges, challenges)
node scripts/check_db_user.js # Debug database connection and verify user
```

**Note:** The seed script creates test users (admin@trickest.com, judge1-3@trickest.com) all with password `password123`.

## Development Principles

### 🚨 CRITICAL RULE: No Gradients on Buttons

**IMPORTANT:** All interactive buttons MUST use solid colors, NOT gradients.

- ❌ **NEVER USE:** `bg-gradient-to-r from-* to-*` on `<button>` or action `<a>` elements
- ✅ **ALWAYS USE:** Solid colors with hover states (e.g., `bg-purple-600 hover:bg-purple-700`)

**Gradients are ONLY allowed for:**
- Text with `text-transparent bg-clip-text`
- Decorative borders on containers
- Background elements (cards, sections)
- Non-interactive visual elements

**Reference:** See `docs/BUTTON_GUIDELINES.md` for complete button styling guide.

**Approved Button Colors:**
- Purple: `bg-purple-600 hover:bg-purple-700` (Primary actions)
- Cyan: `bg-cyan-500 hover:bg-cyan-600` (Info/System actions)
- Yellow: `bg-yellow-500 hover:bg-yellow-600` (Warning/Highlighted actions)
- Green: `bg-green-500 hover:bg-green-600` (Success/Confirm)
- Red: `bg-red-500 hover:bg-red-600` (Danger/Cancel)

### 🎮 CRITICAL: Arcade Floating Buttons - ALWAYS VISIBLE

**IMPORTANT:** The arcade-style floating buttons are a CORE part of the homepage user experience and branding. They MUST always be visible and functional.

**Location & Appearance:**
- **Bottom-left corner:** "⌨️ Press [SPACE]" indicator
- **Bottom-right corner:** "▶️ [PRESS START]" button
- Both have cyan/neon arcade styling with pulsing animations
- Fixed positioning with `z-[100]` (always on top)

**Files Involved:**
- **[src/components/ArcadeButtons.tsx](src/components/ArcadeButtons.tsx)** - Main component with both buttons
- **[src/components/ArcadeButtonsWrapper.tsx](src/components/ArcadeButtonsWrapper.tsx)** - Logic wrapper (handles visibility)
- **[src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx)** - Renders wrapper in layout

**Visibility Logic:**
```typescript
// ArcadeButtonsWrapper.tsx - CURRENT WORKING CODE
const pathSegments = pathname.split('/').filter(Boolean);
const isHomepage = pathSegments.length <= 1; // Shows on '/', '/es', '/en', etc.
if (!isHomepage) return null;
```

**Where Buttons SHOULD Appear:**
- ✅ Homepage root: `/`
- ✅ Homepage with locale: `/es`, `/en`, `/pt`, etc.
- ✅ Any single-segment path (homepage variations)

**Where Buttons Should NOT Appear:**
- ❌ `/dashboard`, `/profile`, `/spots` (internal pages)
- ❌ Any multi-segment path
- ❌ API routes

**Functionality:**
- **"PRESS START" button** → Opens authentication menu (dispatches `arcade-press-start` event)
- **SPACE key** → Same as pressing "PRESS START" (keyboard shortcut)
- Both trigger the SigninButton menu

**⚠️ IF BUTTONS ARE NOT VISIBLE:**
1. **CRITICAL:** This is a HIGH priority bug that affects user acquisition
2. **Check immediately:**
   - Is `ArcadeButtonsWrapper` returning `null`? → Fix the pathname logic
   - Is the component rendered? → Check `[locale]/layout.tsx`
   - Are translations missing? → Check `messages/en.json` and `messages/es.json`
3. **Never remove without explicit user request**
4. **Test on homepage:** Visit `/` and `/es` to verify buttons appear
5. **Mobile responsive:** Buttons should be visible on mobile (adjusted spacing: `bottom-4` vs `md:bottom-6`)

**Styling (DO NOT CHANGE without good reason):**
```typescript
// Bottom-left - Keyboard indicator
<div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[100] bg-neutral-800/95 backdrop-blur-sm px-4 py-3 rounded-lg border-4 border-accent-cyan-500 shadow-2xl shadow-accent-cyan-500/50">

// Bottom-right - Start button
<div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] bg-neutral-800/95 backdrop-blur-sm px-4 py-3 rounded-lg border-4 border-accent-cyan-500 shadow-2xl shadow-accent-cyan-500/50">
```

**Translations Required (in messages/en.json and messages/es.json):**
```json
{
  "arcadeButtons": {
    "pressKey": "Press",  // or "Presiona" (ES)
    "pressStart": "PRESS START"  // or "PRESIONA START" (ES)
  }
}
```

**Common Issues & Fixes:**

| Issue | Cause | Fix |
|-------|-------|-----|
| Buttons not showing on `/es` or `/en` | Pathname check too strict | Change to `pathSegments.length <= 1` |
| Buttons showing on internal pages | Logic too permissive | Add path blacklist or improve segment check |
| Translation missing | Missing key in messages | Add to both `en.json` and `es.json` |
- Buttons overlap with other content | Z-index too low | Ensure `z-[100]` or higher |
- Event not firing | CustomEvent not dispatched | Check `window.dispatchEvent(new CustomEvent('arcade-press-start'))` |

**⚠️ REMEMBER:** These buttons are the PRIMARY way users access authentication on the homepage. If they're broken, users cannot sign up easily. This is CRITICAL for user acquisition.

### Design System - Atomic Design

Follow **Atomic Design methodology** for component organization:

1. **Atoms** (`src/components/atoms/`)
   - Basic building blocks: buttons, inputs, labels, icons
   - No dependencies on other components
   - Highly reusable and isolated
   - Examples: avatar.tsx, circle-image.tsx, container.tsx

2. **Molecules** (`src/components/molecules/`)
   - Simple combinations of atoms
   - Single responsibility, reusable groups
   - Examples: UserScoreBadge, LocationSelector, navbar

3. **Organisms** (`src/components/organisms/`)
   - Complex UI sections composed of molecules/atoms
   - Examples: ChallengeCard, SubmissionHistoryCard, Sidebar components, modals

4. **Templates** (`src/components/templates/`)
   - Page-level layouts without specific content
   - Define structure and placement
   - Examples: dashboard layouts, authentication flows

5. **Pages** (`src/app/`)
   - Specific instances of templates with real content
   - Next.js App Router pages

**Migration Note:** Current components are in flat structure. Gradually refactor into atomic structure when modifying existing components or creating new ones.

### Server-Side Rendering (SSR) Priority

**Default to Server Components** - Next.js 14 App Router uses Server Components by default:

- **Server Components** (default, no "use client"):
  - Data fetching, database queries
  - Direct Prisma access
  - Reduces bundle size
  - Better SEO and initial load performance
  - Most page components and layouts

- **Client Components** ("use client" directive):
  - Only when needed for interactivity
  - useState, useEffect, event handlers
  - Browser APIs (localStorage, window)
  - Third-party libraries requiring client-side
  - Examples: modals, forms with validation, interactive animations

**Data Fetching Patterns:**
```typescript
// Prefer async Server Components
async function Page() {
  const data = await prisma.user.findMany() // Direct DB access
  return <Component data={data} />
}

// Use loading.tsx for loading states
// Use error.tsx for error boundaries
```

### Performance & Optimization

1. **Video/Image Optimization**
   - Use Next.js `<Image>` component for all images
   - Configure image domains in `next.config.mjs`
   - Lazy load video submissions
   - Consider video CDN for production (YouTube embeds for demos)

2. **Code Splitting**
   - Dynamic imports for heavy components: `const Modal = dynamic(() => import('./Modal'))`
   - Lazy load modals and non-critical UI
   - Separate judge/skater dashboard code

3. **Bundle Optimization**
   - Tree-shake unused NextUI components
   - Monitor bundle size with `next build`
   - Use `next/font` for custom fonts

### Security Best Practices

1. **Input Validation**
   - Always validate user input on server-side
   - Sanitize video URLs and user-generated content
   - Use Prisma parameterized queries (prevents SQL injection)

2. **Authentication Guards**
   - Protect API routes with NextAuth session checks
   - Verify roles server-side (never trust client)
   - Use middleware for route protection when possible

3. **OWASP Top 10**
   - Prevent XSS: sanitize HTML, use React's built-in escaping
   - CSRF protection: NextAuth handles this
   - Secure headers: configure in `next.config.mjs`
   - Rate limiting on submission endpoints (consider implementing)

### Accessibility (a11y)

- Use semantic HTML elements
- Ensure keyboard navigation works
- Add ARIA labels where needed
- Test with screen readers
- Color contrast compliance (WCAG AA minimum)
- NextUI components have built-in a11y

### Error Handling

- Use `error.tsx` files for route-level error boundaries
- Graceful degradation for failed video loads
- User-friendly error messages
- Log errors server-side for debugging
- Handle network failures in client components

### SEO Considerations

- Metadata API for dynamic pages (`generateMetadata`)
- Semantic HTML structure
- Open Graph tags for social sharing
- Dynamic sitemaps for user profiles/challenges
- Performance optimization (Core Web Vitals)

## Architecture

### Database & Authentication

- **Database:** PostgreSQL via Prisma ORM
  - Uses Supabase with connection pooling (DATABASE_URL port 6543) and direct connections (DIRECT_URL port 5432)
  - Main models: User, SocialMedia, WishSkate, Challenge, Submission, Team
  - Users are identified by email (not ID) across relationships

- **Authentication:** NextAuth.js v4 with dual provider strategy
  - Google OAuth: Auto-creates users with `profileStatus: 'basic'` and `password: null`
  - Credentials: Email/password login using bcrypt
  - Session stored in JWT with custom fields: `profileStatus`, `hasPassword`, `role`
  - Auth route: `src/app/api/auth/[...nextauth]/route.ts`
  - Type definitions: `src/types/next-auth.d.ts`

### User System & Roles

Three role types managed via `User.role` field:
- **skater** (default): Can submit trick videos, manage profile, join teams
- **judge**: Can evaluate submissions in addition to skater features
- **admin**: Full access (currently same as judge + ownership privileges)

Role helpers in `src/lib/auth-helpers.ts`: `getUserRole()`, `isJudge()`, `isAdmin()`, `canEvaluateSubmissions()`

### Profile Status Flow

Users progress through status states in `User.profileStatus`:
1. **basic** - Only Google OAuth data, no password set
2. **complete** - Full profile with password, personal info, and skate data

Modals guide users through completion:
- `SetPasswordModal` - Password creation for Google users
- `SkateProfileCompletionModal` - Multi-step profile completion (general info, dream setup, social media)
- `WelcomeModal` - Post-completion welcome screen

### Application Structure

**Route Groups:**
- `src/app/(routes)/` - Public pages and dashboards
  - `dashboard/skaters/` - Skater features (profile, tricks, achievements)
  - `dashboard/judges/` - Judge features (evaluate submissions)
  - `dashboard/jueces/` - Legacy judge routes (consider consolidating)

**API Routes:** `src/app/api/`
- `auth/` - NextAuth endpoints, registration, password setting
- `skate_profiles/` - Profile data endpoints (general_info, dream_setup, social_media)
- `submissions/` - Trick submission management (pending, evaluate)
- `users/` - User data endpoints (score)

**Components:** Following Atomic Design principles

Current structure (flat, to be migrated):
- `src/components/` - All components in flat structure
- `src/components/sidebar/` - Dashboard navigation components
- `src/components/partners/` - Partner/sponsor components
- `src/components/fonts/` - Font assets

Target structure (implement gradually):
- `src/components/atoms/` - Basic elements (buttons, inputs, icons, avatars)
- `src/components/molecules/` - Simple combinations (UserScoreBadge, navbar)
- `src/components/organisms/` - Complex sections (ChallengeCard, Sidebar, modals)
- `src/components/templates/` - Page layouts (dashboard templates)

Key Component Categories:
- **Authentication Flow:** SigninButton, LoginEmailForm, RegisterEmailForm, SetPasswordModal
- **Profile Management:** SkateProfileCompletionModal, WelcomeModal, avatar components
- **Challenge System:** ChallengeCard, SubmitTrickModal, GalerryLevels
- **Submissions:** SubmissionHistoryCard, evaluation interfaces
- **Navigation:** Sidebar (skaters), SidebarJuez (judges), navbar, Appbar
- **Utilities:** LocationSelector, transition components, particles effects

**Providers:**
- `SessionWrapper` in `src/providers/` wraps app with NextAuth session

### Challenge System

- **10 difficulty levels** + 1 bonus challenge seeded in database
- Each challenge has: name, description, demoVideoUrl (YouTube), difficulty, points
- Submissions link users to challenges with status: "pending" → "approved"/"rejected"
- Judges evaluate submissions and assign scores (0-100) plus feedback

### Styling & Design System

- **Tailwind CSS** with NextUI components (`@nextui-org/react`)
- **Visual Style:** Arcade/retro-futurista with neon effects, thick borders (4px), uppercase text
- **Custom colors** defined in `tailwind.config.ts`:
  - `watermelon` (#F35588) - Primary CTAs and highlights
  - `melon` (#FFBBB4) - Hover states and soft accents
  - `budGreen` (#71A95A) - Success and active states
  - `dartmouthGreen` (#007944) - Success dark variant
  - `darkBg` (#131424) - App background
- **Color Palette:** Cyan (tech/system), Purple (premium/creative), Green/Teal (success/social)
- **Gradients:** Heavy use of `from-cyan-500 to-purple-600` style gradients for headers and CTAs
- **Typography:** Font-black (900 weight), uppercase, tracking-wider for arcade aesthetic
- **Effects:** Glow shadows (`shadow-lg shadow-cyan-500/50`), hover scale transforms
- **Animations:** Framer Motion for transitions, custom fadeIn keyframe
- **Particles:** TSParticles for landing page effects

**Design Documentation:**
- Full design system & color palette: `docs/DESIGN_SYSTEM.md`

**UI Patterns:**
- Bordered cards with gradient borders (neon effect)
- Arcade-style buttons with 4px white borders
- Tab navigation with gradient active states
- Dashboard backgrounds use multi-stop gradients (`from-slate-900 via-purple-900 to-slate-900`)
- Emoji usage for visual hierarchy (🎮 👤 🛹 🌐 etc.)

### Key Patterns

1. **Prisma Client:** Always import from `@/app/lib/prisma` (not direct PrismaClient) to ensure singleton pattern in development
2. **Path Aliases:** Use `@/*` to import from `src/*`
3. **Image Domains:** Configured in `next.config.mjs` for external images (Google, Unsplash, etc.)
4. **ESLint:** Disabled during builds (`ignoreDuringBuilds: true`)
5. **Design System:** Always reference `docs/DESIGN_SYSTEM.md` when creating/modifying UI components
6. **Color Usage:** Use custom colors from `tailwind.config.ts` for brand consistency (watermelon, melon, budGreen, dartmouthGreen, darkBg)
7. **Component Styling:** Follow arcade aesthetic - thick borders (4px), uppercase text, gradient backgrounds, glow effects

### Environment Variables

Required variables (see `.env.example`):
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `DATABASE_URL` (port 6543 with pgbouncer), `DIRECT_URL` (port 5432)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`

## Best Practices & Code Standards

### TypeScript

- **Strict typing:** Enable strict mode in `tsconfig.json`
- Define interfaces for all data structures (User, Challenge, Submission, etc.)
- Type API responses and database queries
- Use Prisma-generated types when possible
- Create custom types in `src/types/` for domain models
- Extend NextAuth types in `src/types/next-auth.d.ts`

### UI/UX Development

- **Design System First:** Always consult `docs/DESIGN_SYSTEM.md` before creating components
- **Color Consistency:** Use only colors from `tailwind.config.ts` and `docs/DESIGN_SYSTEM.md`
- **Arcade Aesthetic:** Maintain retro-futurista style (thick borders, uppercase, gradients, neon glows)
- **Component Reusability:** Build atoms → molecules → organisms (Atomic Design)
- **Responsive Design:** Mobile-first approach, test all breakpoints (sm, md, lg, xl)
- **Accessibility:** Semantic HTML, keyboard navigation, ARIA labels, WCAG AA compliance
- **Animations:** Subtle and purposeful, max 0.3-0.5s duration (use Framer Motion or CSS)
- **Emoji Usage:** Part of visual identity - use for icons and visual hierarchy (🎮 🛹 👤 etc.)

### State Management

- **Server State:** Default approach with Server Components + database queries
- **Client State:** Use React hooks (useState, useReducer) for local UI state
- **Form State:** Consider React Hook Form for complex forms
- **Global State:** Avoid unless necessary; use React Context sparingly
- **Session State:** NextAuth session via useSession() hook

### API Design

- **RESTful conventions:** Use proper HTTP methods (GET, POST, PUT, DELETE)
- **Error handling:** Return consistent error responses with status codes
- **Validation:** Validate all inputs before database operations
- **Response format:** Consistent JSON structure `{ success: boolean, data?: any, error?: string }`
- **Rate limiting:** Implement for submission endpoints (future)

### Testing Strategy (To Implement)

- **Unit tests:** For utility functions, helpers, business logic
- **Integration tests:** For API routes with test database
- **E2E tests:** For critical flows (signup, submission, evaluation)
- **Tools:** Jest, React Testing Library, Playwright
- **Coverage:** Aim for 70%+ on core business logic

### Git Workflow

- **Branch naming:** `feature/`, `fix/`, `refactor/`, `docs/`
- **Commit messages:** Conventional commits (feat:, fix:, refactor:, etc.)
- **PR reviews:** Required for main branch
- **CI/CD:** Run linting, type-checking, tests before merge

### Performance Monitoring

- Monitor Core Web Vitals (LCP, FID, CLS)
- Track video load times
- Database query performance (use Prisma metrics)
- Bundle size analysis
- Lighthouse scores (aim for 90+)

## Internationalization (i18n)

This project uses **next-intl** for internationalization with locale-based routing (`/en`, `/es`).

### i18n Structure

```
src/
├── i18n/
│   ├── routing.ts      # Locale configuration (en, es)
│   └── request.ts      # Server-side message loading
├── middleware.ts       # Locale detection and routing
└── app/
    └── [locale]/       # All pages under locale segment
        ├── layout.tsx  # Locale-aware layout with NextIntlClientProvider
        └── (routes)/   # All routes

messages/
├── en.json            # English translations
└── es.json            # Spanish translations
```

### How to Use Translations

**In Client Components (`'use client'`):**
```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace'); // e.g., 'sidebar', 'loginForm'

  return <h1>{t('title')}</h1>;
}
```

**In Server Components:**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('namespace');

  return <h1>{t('title')}</h1>;
}
```

### Adding New Translations

1. Add keys to both `messages/en.json` and `messages/es.json`
2. Use nested structure by namespace:
```json
{
  "myComponent": {
    "title": "My Title",
    "description": "My description"
  }
}
```

3. Access with: `t('title')` when using `useTranslations('myComponent')`

### Link Navigation

**IMPORTANT:** Use the i18n-aware Link for internal navigation:
```typescript
import { Link } from '@/i18n/routing';

// This automatically adds the locale prefix
<Link href="/dashboard">Dashboard</Link>
```

Do NOT use `next/link` directly for internal routes.

### Translation Namespaces

Current namespaces in use:
- `common` - Shared UI elements (loading, save, cancel, etc.)
- `auth` - Authentication labels
- `navigation` - Nav menu items
- `sidebar` - Dashboard sidebar
- `menu` - Menu items
- `home` - Home page content
- `dashboard`, `spots`, `challenges`, `submissions`, `leaderboard`, `profile`, `teams`, `judges`, `admin` - Feature sections
- `notifications` - Notification dropdown
- `errors` - Error messages
- `signinMenu` - Main menu modal
- `loginForm` - Login form
- `registerForm` - Register form
- `setPasswordModal` - Password setup modal

### Style Guidelines for Translations

- **NO excessive emojis** - Keep UI professional. Use emojis sparingly for visual hierarchy only
- **Uppercase for buttons/headers** - Matches arcade aesthetic
- **Consistent terminology** - Use same terms across translations

## Important Notes

- Users are uniquely identified by **email** (not numeric ID) in most relationships
- When creating migrations, always test with both `DATABASE_URL` and `DIRECT_URL`
- Password hashing uses bcrypt with 10 rounds
- NextAuth callbacks query the database on every JWT/session operation to keep role/status fresh
- **Always prioritize SSR over CSR** unless interactivity requires client components
- **Follow Atomic Design** when creating or refactoring components
- **Consult `docs/DESIGN_SYSTEM.md`** before creating any new UI components
- **Use the custom color palette** (watermelon, melon, budGreen, dartmouthGreen, darkBg) for brand consistency
- **Maintain arcade/retro-futurista aesthetic** - thick borders, uppercase text, gradients, glow effects
- Video content is the core feature - optimize heavily for video performance and UX
- Emojis are part of the visual identity - use them purposefully for hierarchy and context

### 🎮 CRITICAL: Arcade Floating Buttons

**⚠️ NEVER REMOVE OR BREAK THE ARCADE FLOATING BUTTONS ON HOMEPAGE**

The arcade floating buttons (bottom-left: "⌨️ Press [SPACE]" and bottom-right: "▶️ [PRESS START]") are a **CRITICAL** part of the homepage user experience:

- **Primary authentication entry point** - Users use these to access login/signup
- **Core branding element** - Defines the arcade aesthetic of the platform
- **ALWAYS visible on homepage** - Must work on `/`, `/es`, `/en`, and any locale variant
- **NOT visible on internal pages** - Dashboard, profile, etc. (intentional design)

**Files:**
- `src/components/ArcadeButtons.tsx` - Button components
- `src/components/ArcadeButtonsWrapper.tsx` - Visibility logic (shows on homepage only)
- `src/app/[locale]/layout.tsx` - Renders the buttons

**⚠️ IF BUTTONS STOP WORKING:**
- This is a **PRIORITY 1 BUG** - affects user acquisition
- Check `ArcadeButtonsWrapper` pathname logic
- Verify translations in `messages/en.json` and `messages/es.json`
- Test on homepage: `/`, `/es`, `/en`

**See section "Development Principles → 🎮 CRITICAL: Arcade Floating Buttons" above for complete details.**
