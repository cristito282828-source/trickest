import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thetrickest.app'

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
      // Bots de IA (ChatGPT, Claude, etc.) - permitir pero no priorizar
      {
        userAgent: ['GPTBot', 'Claude-Web', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/account/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
