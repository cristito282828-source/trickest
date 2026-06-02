'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

const locales = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => handleLocaleChange(loc.code)}
          disabled={isPending}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider
            transition-all duration-200 transform hover:scale-105
            border-2
            ${locale === loc.code
              ? 'bg-accent-cyan-500 border-accent-cyan-500 text-white shadow-lg shadow-accent-cyan-500/50 hover:bg-accent-cyan-600 hover:border-accent-cyan-600'
              : 'bg-transparent border-neutral-600 text-neutral-400 hover:border-accent-cyan-500 hover:text-accent-cyan-400'
            }
            ${isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
          title={loc.code === 'en' ? 'English' : 'Español'}
        >
          <span className="text-base">{loc.flag}</span>
          <span>{loc.label}</span>
        </button>
      ))}
    </div>
  );
}
