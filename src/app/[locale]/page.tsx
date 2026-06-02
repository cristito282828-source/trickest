import HowWin from '@/components/howToWin';
import Introduction from '@/components/introduction';
import Partners from '@/components/partners/partners';
import TransitionPage from '@/components/transition-page';
import HomeLevelSection from '@/components/HomeLevelSection';
import HomeMapSection from '@/components/HomeMapSection';
import HomeRanking from '@/components/HomeRanking';
import ContactCTAButton from '@/components/ContactCTAButton';
import ActivityTicker from '@/components/ActivityTicker';
import { getTranslations } from 'next-intl/server';
import AuthRedirect from '@/components/AuthRedirect';

export default async function Home({
  searchParams,
}: {
  searchParams: { auth?: string };
}) {
  const t = await getTranslations('home');
  return (
    <>
      {/* Handle auth redirect if user was sent here from middleware */}
      <AuthRedirect authRequired={searchParams.auth === 'required'} />

      <div className="flex">
        <TransitionPage />
        <Introduction />
      </div>

      {/* Activity Ticker - Shows recent user activity */}
      <ActivityTicker />

      {/* Challenges Section */}
      <HomeLevelSection />

      {/* <div className='pt-28 text-center'>
        <h1 className='text-neutral-200 my-16 text-2xl md:text-4xl font-bold'>High Scores</h1>
        <HighScore />
      </div> */}

      {/* Ranking Section */}
      <HomeRanking />

      {/* How to Win Section */}
      <HowWin />

      {/* Skaters Showcase Section - Hidden for now */}
      {/* <div className="pt-28 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-neutral-200 uppercase tracking-wider mb-4">
            🛹 CONOCE LA COMUNIDAD
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Descubre skaters talentosos, sigue sus progresos y conecta con la
            comunidad Trickest
          </p>
        </div>

        <SkatersShowcase />
      </div> */}

      {/* Map Section */}
      <HomeMapSection />

      {/* Partners Section */}
      <div>
        <Partners />
      </div>

      {/* Contact CTA Section */}
      <ContactCTAButton />

      {/* <div>
        <Footer />
      </div> */}
    </>
  );
}
