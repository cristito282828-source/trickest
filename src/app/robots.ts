import { MetadataRoute } from 'next'
import { SITE_URL } from '@/config/site'

// Dynamic robots.txt — sitemap/host derive from SITE_URL so they always point
// to the canonical domain (no hardcoded non-www/staging domain).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/account/',
          '/coming-soon',
          '/auth/',
          '/_next/',
          '/static/',
        ],
      },
      // AI bots (ChatGPT, Claude, etc.) — allow public content, keep private areas out
      {
        userAgent: ['GPTBot', 'Claude-Web', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/account/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
