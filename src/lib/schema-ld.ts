import { Metadata } from 'next';

// Schema JSON-LD for TRICKEST
// Helps Google understand the site structure

export function generateSchemaLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://trickest.vercel.app/#website',
        url: 'https://trickest.vercel.app/',
        name: 'TRICKEST',
        description: 'TRICKEST - Skateboard Challenge Platform. Submit trick videos, get scored by judges, compete in global leaderboards.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://trickest.vercel.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'WebApplication',
        '@id': 'https://trickest.vercel.app/#webapp',
        name: 'TRICKEST - Skateboard Challenge Platform',
        url: 'https://trickest.vercel.app/',
        description: 'Online skateboarding challenge platform where skaters can submit trick videos, receive scores from judges, and compete on global leaderboards.',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Video trick submissions',
          'Judge scoring system',
          'Global leaderboards',
          'Team competitions',
          'Challenge levels',
          'Real-time rankings'
        ],
        aggregator: {
          '@type': 'Organization',
          name: 'TRICKEST',
          url: 'https://trickest.vercel.app'
        }
      },
      {
        '@type': 'Organization',
        '@id': 'https://trickest.vercel.app/#organization',
        name: 'TRICKEST',
        url: 'https://trickest.vercel.app/',
        logo: 'https://trickest.vercel.app/logo-main.png',
        description: 'TRICKEST is a skateboard challenge platform connecting skaters worldwide through competitive video submissions and judge scoring.',
        sameAs: [
          // Add your social media URLs when available
          // 'https://instagram.com/trickest',
          // 'https://twitter.com/trickest',
          // 'https://youtube.com/@trickest'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'privacy@trickest.com'
        }
      },
      {
        '@type': 'SportsActivityLocation',
        '@id': 'https://trickest.vercel.app/#sportsactivity',
        name: 'TRICKEST Skateboard Challenges',
        description: 'Online skateboard challenge platform with video submissions and judge scoring',
        sport: 'Skateboarding',
        url: 'https://trickest.vercel.app/',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'US'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://trickest.vercel.app/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://trickest.vercel.app/'
          }
        ]
      }
    ]
  };

  return schema;
}
