'use client';

import { useTranslations } from 'next-intl';

const StartLevel = () => {
  const t = useTranslations('startLevel');

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/pixel-art-background.png')" }}
    >
      <div className="text-center">
        <h1
          className="text-7xl text-white font-bold"
          style={{ fontFamily: 'monospace' }}
        >
          {t('title')}
        </h1>
        <button
          className="mt-8 px-8 py-4 bg-accent-blue-600 text-white text-2xl font-bold border-4 border-accent-blue-400 rounded-lg hover:bg-accent-blue-700 transition-colors"
          style={{ fontFamily: 'monospace' }}
        >
          {t('button')}
        </button>
      </div>
    </div>
  );
};

export default StartLevel;
