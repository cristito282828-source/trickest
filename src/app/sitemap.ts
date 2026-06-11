import { MetadataRoute } from 'next'
import prisma from '@/app/lib/prisma'
import { SITE_URL } from '@/config/site'

// Force regeneration on each request in production (disables Vercel's 1h cache)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const locales = ['en', 'es']

  // Static public, indexable routes only. about/services/portfolio/testimonials
  // are noindex template pages — excluded until rewritten with real content.
  const staticRoutes = [
    '',
    'contacto',
    'spots',
    'explore',
  ]

  // Rutas privadas (no se indexan)
  const privatePrefixes = ['dashboard', 'admin', 'coming-soon', 'account']

  // Generar entries para rutas estáticas en todos los locales
  const staticEntries: MetadataRoute.Sitemap = []
  locales.forEach((locale) => {
    staticRoutes.forEach((route) => {
      staticEntries.push({
        url: `${baseUrl}/${locale}${route ? `/${route}` : ''}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${route ? `/${route}` : ''}`,
            es: `${baseUrl}/es${route ? `/${route}` : ''}`,
          },
        },
      })
    })
  })

  // Rutas dinámicas: perfiles públicos
  let profileEntries: MetadataRoute.Sitemap = []
  try {
    const profiles = await prisma.user.findMany({
      where: {
        username: { not: null },
        profileStatus: { not: 'private' },
      },
      select: {
        username: true,
      },
      take: 1000, // Límite razonable para sitemap
    })

    profileEntries = profiles
      .filter((p) => p.username)
      .flatMap((p) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/profile/${encodeURIComponent(p.username!)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      )
  } catch (error) {
    console.error('Error generating profile sitemap entries:', error)
  }

  // Rutas dinámicas: páginas de trucos
  let trickEntries: MetadataRoute.Sitemap = []
  try {
    const tricks = await prisma.challenge.findMany({
      select: {
        name: true,
        level: true,
      },
      orderBy: { level: 'asc' },
      take: 200,
    })

    trickEntries = tricks.flatMap((trick) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/dashboard/skaters/tricks/${encodeURIComponent(trick.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    )
  } catch (error) {
    console.error('Error generating tricks sitemap entries:', error)
  }

  // Rutas dinámicas: teams
  let teamEntries: MetadataRoute.Sitemap = []
  try {
    const teams = await prisma.team.findMany({
      select: {
        name: true,
      },
      take: 200,
    })

    teamEntries = teams.flatMap((team) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/teams/${encodeURIComponent(team.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    )
  } catch (error) {
    console.error('Error generating teams sitemap entries:', error)
  }

  return [...staticEntries, ...profileEntries, ...trickEntries, ...teamEntries]
}
