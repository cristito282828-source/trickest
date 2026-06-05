import { MetadataRoute } from 'next'
import { SITE_URL } from '@/config/site'

// Dynamic robots.txt — the sitemap URL is derived from SITE_URL so it always
// points to the canonical domain (no more hardcoded staging domain).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
