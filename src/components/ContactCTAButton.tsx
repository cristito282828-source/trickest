'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function ContactCTAButton() {
  const t = useTranslations('contactCTAButton');

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto text-center">
        <Link
          href="/contacto"
          className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-wider px-16 py-6 rounded-lg border-4 border-cyan-400 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-200 text-xl hover:scale-105"
        >
          {`${t('joinTeam')} 🚀`}
        </Link>
      </div>
    </div>
  );
}
