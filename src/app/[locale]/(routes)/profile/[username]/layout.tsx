import { Metadata } from 'next';

interface ProfileLayoutProps {
  children: React.ReactNode;
  params: { username: string; locale: string };
}

export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { username, locale } = params;

  try {
    // Fetch profile data for metadata
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trickest.com';
    const response = await fetch(`${baseUrl}/api/users/profile/${username}`, {
      cache: 'no-store'
    });

    if (response.ok) {
      const profile = await response.json();

      const roleEmoji = {
        skater: '🛹',
        judge: '⚖️',
        admin: '👑'
      };

      const achievements = profile.achievements?.length || 0;
      const followers = profile.socialStats?.followerCount || 0;
      const profileUrl = `${baseUrl}/${locale}/profile/${username}`;

      // Preparar imagen Open Graph (asegurar URL completa)
      const ogImage = profile.photo
        ? (profile.photo.startsWith('http') ? profile.photo : `${baseUrl}${profile.photo}`)
        : `${baseUrl}/logo.png`;

      return {
        title: `${profile.name || 'Skater'} - Trickest Profile ${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'}`,
        description: `${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'} ${profile.name || 'Skater'} - ${profile.stats?.totalScore || 0} points, ${profile.stats?.challengesCompleted || 0} completed tricks, ${achievements} achievements. ${followers} followers. Check out their profile on Trickest!`,
        keywords: ['skateboarding', 'tricks', 'skater', 'trickest', profile.name, profile.role, 'skate community'],
        authors: [{ name: profile.name || 'Trickest Skater' }],
        openGraph: {
          title: `${profile.name || 'Skater'} - Trickest Profile ${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'}`,
          description: `${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'} ${profile.role} skater with ${profile.stats?.totalScore || 0} points and ${profile.stats?.challengesCompleted || 0} completed tricks. ${achievements} unlocked achievements. Join the community!`,
          url: profileUrl,
          siteName: 'Trickest',
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `${profile.name || 'Skater'}'s Profile on Trickest - ${profile.stats?.totalScore || 0} points`,
            },
          ],
          locale: locale === 'es' ? 'es_ES' : 'en_US',
          type: 'profile',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${profile.name || 'Skater'} - Trickest ${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'}`,
          description: `${roleEmoji[profile.role as keyof typeof roleEmoji] || '🛹'} ${profile.stats?.totalScore || 0} points, ${profile.stats?.challengesCompleted || 0} tricks, ${achievements} achievements. Check out their profile!`,
          creator: '@trickestapp',
          images: [ogImage],
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        alternates: {
          canonical: profileUrl,
        },
        other: {
          'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  // Fallback metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trickest.com';
  return {
    title: 'Trickest Profile',
    description: 'Skater profile on Trickest',
    openGraph: {
      url: `${baseUrl}/${locale}/profile/${username}`,
      siteName: 'Trickest',
    },
  };
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <>{children}</>;
}