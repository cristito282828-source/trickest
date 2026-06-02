# Prompt: Complete i18n Translation Coverage for TheTrickest

> Copy this entire prompt into a new Claude Code session to finish the i18n work.

---

## Context

TheTrickest is a skateboarding challenge platform built with Next.js 14 + next-intl for internationalization. The i18n setup is 95%+ complete. This task is to fix the remaining 5 files that still have hardcoded Spanish text instead of using translation keys.

## Project Setup

- **Framework:** Next.js 14 App Router with `[locale]` segment
- **i18n Library:** next-intl
- **Locales:** `en` (default), `es`
- **Translation files:** `messages/en.json` and `messages/es.json`
- **Routing:** All pages under `src/app/[locale]/`
- **Locale config:** `src/i18n/routing.ts` (localePrefix: 'always')

## How Translations Work

**Client Components (`'use client'`):**
```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

**Server Components:**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

**For metadata in Server Components:**
```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}
```

**Internal links must use the i18n-aware Link:**
```typescript
import { Link } from '@/i18n/routing';
// NOT import Link from 'next/link';
```

## Files to Fix

### 1. `src/app/[locale]/(routes)/about/page.tsx`

**Problem:** Lines 11-14 have metadata hardcoded in Spanish (references old "Watermelon Code" branding).

**Current code:**
```typescript
export const metadata: Metadata = {
  title: 'Watermelon Code - Desarrollo y Diseno Web en Bogota',
  description: 'Nuestra mision es impulsar la innovacion...',
  keywords: 'Watermelon Code, desarrollo web...',
};
```

**Fix:** Replace the static `metadata` export with a `generateMetadata` async function that uses `getTranslations`. Update both `messages/en.json` and `messages/es.json` with an `about` namespace containing `metaTitle`, `metaDescription`, and `metaKeywords`. The content should be relevant to TheTrickest (skateboarding platform), NOT Watermelon Code.

**Suggested translations:**
- EN title: "About - TheTrickest | Skateboarding Challenge Platform"
- EN description: "Learn about TheTrickest, the ultimate skateboarding challenge platform. Submit tricks, compete with skaters worldwide, and climb the leaderboard."
- ES title: "Acerca de - TheTrickest | Plataforma de Desafios de Skateboarding"
- ES description: "Conoce TheTrickest, la plataforma definitiva de desafios de skateboarding. Envia trucos, compite con skaters de todo el mundo y escala en el leaderboard."

### 2. `src/app/[locale]/(routes)/contacto/page.tsx`

**Problem:** Lines 3-5 have metadata hardcoded in Spanish.

**Current code:**
```typescript
export const metadata = {
  title: 'Contacto - Trickest',
  description: 'Unete al movimiento. Colabora con nosotros...',
};
```

**Fix:** Same approach as about page - replace with `generateMetadata` using `getTranslations`. Add a `contact` namespace to both translation files.

**ALSO:** Consider renaming the route from `/contacto/` to `/contact/` for consistency with the English-first approach (the URL should be language-neutral or English). If renaming is too risky, at least fix the metadata.

### 3. `src/components/organisms/LevelNavigator.example.tsx`

**Problem:** Lines 19, 38, 56, 67, 84, 128 have demo text in Spanish. This is an EXAMPLE file showing how to use the LevelNavigator component.

**Current hardcoded Spanish strings:**
- Line 19: `'OLLIE BASICO'`
- Line 19: `'Domina el truco mas fundamental del skateboarding!'`
- Line 38: `'Gira tu tabla con estilo. Es hora de kickflipear!'`
- Line 56: `'La combinacion perfecta de kickflip y 360 shove-it'`
- Line 67: `'Desafio extra! Manten el equilibrio como un pro'`
- Line 84: `'Desliza por rieles y bordes con precision'`
- Line 128: `'Completa los desafios y conviertete en una leyenda del skate'`

**Fix:** Since this is an example/demo file, you have two options:
1. **(Preferred)** Delete the file entirely if it's not imported anywhere. Check with `grep -r "LevelNavigator.example" src/` first. If no imports, delete it.
2. If it IS imported somewhere, convert the strings to English (it's demo content, doesn't need full i18n).

### 4. `src/components/LanguageSwitcher.tsx`

**Problem:** Line 43 has a hardcoded Spanish string in the `title` attribute.

**Current code:**
```typescript
title={loc.code === 'en' ? 'English' : 'Espanol'}
```

**Fix:** This is actually acceptable as-is (language names in their own language is a common i18n pattern). However, if you want to be thorough, you can use `useTranslations` to pull these from translation files. The priority here is LOW - this is not a user-facing bug.

### 5. `src/app/[locale]/(routes)/dashboard/teams/page.tsx`

**Problem:** Line 151 has Spanish debug console.log statements.

**Current code (around line 147-154):**
```typescript
console.log('===== DEBUG FRONTEND =====');
console.log('newTeamName RAW:', newTeamName);
console.log('Con comillas:', `"${newTeamName}"`);
// ... more debug logs
```

**Fix:** Remove ALL the debug console.log statements (lines ~147-154 and ~164-167 and ~277-278 and ~288). These are leftover debugging artifacts, not i18n issues. Just delete them.

## Translation File Structure

The translation files are at the project root in `messages/en.json` and `messages/es.json`. They use nested namespaces:

```json
{
  "common": { ... },
  "auth": { ... },
  "navigation": { ... },
  "about": {
    "metaTitle": "...",
    "metaDescription": "..."
  }
}
```

**Existing namespaces (do not duplicate):** common, auth, navigation, sidebar, menu, home, dashboard, spots, challenges, submissions, leaderboard, profile, teams, judges, admin, notifications, errors, signinMenu, loginForm, registerForm, setPasswordModal, footer, votingCard, welcomeModal, submissionHistory, skateProfileCompletion

## Rules

1. **Do NOT add emojis** to translation strings unless the original already has them
2. **Keep the arcade aesthetic** - uppercase for headings/buttons is fine
3. **Test the build** after changes: `npm run build`
4. **Do NOT modify** any files other than the 5 listed above + the two translation JSON files
5. **Commit** with message: `fix(i18n): complete translation coverage for remaining hardcoded text`
6. **Branch:** You should be on `feature/i18n-translations` or `master`

## Verification

After making changes, verify:
```bash
# Search for remaining Spanish text (should return minimal results)
grep -rn "Desarrollo\|mision\|Colabora\|Domina\|desafio\|Desliza\|precision\|equilibrio" src/ --include="*.tsx" --include="*.ts"

# Build should pass
npm run build
```

## Priority Order

1. Fix `about/page.tsx` (most visible, wrong branding)
2. Fix `contacto/page.tsx` (user-facing metadata)
3. Clean up `teams/page.tsx` (remove debug logs)
4. Handle `LevelNavigator.example.tsx` (delete or translate)
5. Leave `LanguageSwitcher.tsx` as-is (acceptable pattern)
