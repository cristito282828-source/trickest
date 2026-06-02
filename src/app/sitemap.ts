import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const locales = ['en', 'es']

  // Static routes
  const routes = ['', 'about', 'contacto', 'spots', 'explore', 'testimonials', 'services', 'portfolio']

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
