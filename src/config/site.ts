/**
 * Single source of truth for the site's canonical URL and identity.
 *
 * The domain comes from the NEXT_PUBLIC_APP_URL environment variable.
 * To rebrand the domain you only change that ONE variable (in Vercel /
 * .env) — sitemap, robots, JSON-LD schema, canonical tags and Open Graph
 * URLs all derive from here.
 *
 * IMPORTANT: in production NEXT_PUBLIC_APP_URL must be the canonical host
 * that is actually served, i.e. the `www` version:
 *   NEXT_PUBLIC_APP_URL=https://www.thetrickest.app
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_NAME = 'TRICKEST';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export const DEFAULT_LOCALE = 'en';

/**
 * Build canonical + hreflang alternates for a localized route.
 *
 * @param locale current locale (e.g. 'en')
 * @param path   path after the locale, WITHOUT leading slash (e.g. 'about').
 *               Empty string for the locale home.
 *
 * Usage in a page's generateMetadata:
 *   export async function generateMetadata({ params }) {
 *     const { locale } = await params;
 *     return { alternates: localizedAlternates(locale, 'about') };
 *   }
 */
export function localizedAlternates(locale: string, path = '') {
  const clean = path ? `/${path.replace(/^\//, '')}` : '';
  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages: {
      en: `${SITE_URL}/en${clean}`,
      es: `${SITE_URL}/es${clean}`,
      'x-default': `${SITE_URL}/en${clean}`,
    },
  };
}
