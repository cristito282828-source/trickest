/**
 * Single source of truth for the brand IDENTITY.
 *
 * The domain / canonical URL lives in ./site.ts. Everything else that makes up
 * the brand — name, contact emails, social handles, storage bucket — lives
 * here. To rebrand, edit THIS file (plus globals.css for colors and
 * public/logo-*.png for the logo).
 *
 * NOTE: changing `storage.bucket` is NOT just a code change — it requires
 * creating and migrating the bucket in Supabase. See
 * docs/ARCH_BRANDING_AUDIT_2026-06-04.md.
 */
export const BRAND = {
  name: 'TRICKEST',
  email: {
    privacy: 'privacy@trickest.com',
    legal: 'legal@trickest.com',
  },
  social: {
    // X/Twitter handle (with @) used for twitter:creator.
    twitter: '@trickestapp',
    // Usernames only (no @ / no URL) — leave empty until the official
    // profiles exist. These feed schema.org `sameAs` below.
    instagram: '',
    tiktok: '',
    youtube: '',
  },
  // Supabase storage bucket (value unchanged on purpose — see NOTE above).
  storage: {
    bucket: 'trickest-spots',
  },
} as const;

/**
 * Full social profile URLs for schema.org `sameAs`. Only includes profiles
 * that are actually set, so an empty handle never produces a broken URL.
 */
export const BRAND_SAME_AS: string[] = [
  BRAND.social.instagram && `https://www.instagram.com/${BRAND.social.instagram}`,
  BRAND.social.tiktok && `https://www.tiktok.com/@${BRAND.social.tiktok}`,
  BRAND.social.youtube && `https://www.youtube.com/@${BRAND.social.youtube}`,
].filter(Boolean) as string[];
