import { MetadataRoute } from 'next'
import { SITE_URL } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL
  const locales = ['en', 'es']

  // Static routes (public, indexable only).
  // about/services/portfolio/testimonials are noindex template pages — excluded
  // until they are rewritten with real TheTrickest content.
  const routes = ['', 'contacto', 'spots', 'explore']

  // Generate sitemap entries for all locales
  const sitemapEntries: MetadataRoute.Sitemap = []

  locales.forEach(locale => {
    routes.forEach(route => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route ? '/' + route : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })

  return sitemapEntries
}
