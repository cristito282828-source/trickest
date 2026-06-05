import { SITE_URL, SITE_NAME } from '@/config/site';

// Schema JSON-LD for TRICKEST.
// Helps Google and AI search engines (ChatGPT, Perplexity, Gemini) understand
// the site as an entity. All URLs derive from SITE_URL (see src/config/site.ts),
// so changing the domain is a one-variable change.
//
// TODO (high impact for AI visibility): fill `sameAs` with the official social
// profiles below. An empty sameAs means AI models cannot link the brand to its
// presence on Instagram / TikTok / YouTube.
const SOCIAL_PROFILES: string[] = [
  // 'https://www.instagram.com/__REPLACE__',
  // 'https://www.tiktok.com/@__REPLACE__',
  // 'https://www.youtube.com/@__REPLACE__',
];

export function generateSchemaLd(locale: string = 'en') {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo-main.png`,
        },
        description:
          'TheTrickest is a skateboarding challenge platform connecting skaters worldwide through competitive video submissions and judge scoring.',
        sameAs: SOCIAL_PROFILES,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description:
          'TheTrickest - Skateboard Challenge Platform. Submit trick videos, get scored by judges, compete on global leaderboards.',
        inLanguage: locale,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#webapp`,
        name: 'TheTrickest - Skateboard Challenge Platform',
        url: `${SITE_URL}/`,
        description:
          'Online skateboarding challenge platform where skaters submit trick videos, receive scores from real judges, and compete on global leaderboards.',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Video trick submissions',
          'Judge scoring system',
          'Global leaderboards',
          'Team competitions',
          'Challenge levels',
          'Skatepark and skater map',
        ],
      },
    ],
  };

  return schema;
}
