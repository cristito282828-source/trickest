'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface Partner {
  name: string;
  roleKey: 'deepfcRole' | 'nandarkRole' | 'torySkateshopRole';
  imageSrc: string;
  website?: string;
}

const partners: Partner[] = [
  {
    name: 'DeepFC',
    roleKey: 'deepfcRole',
    imageSrc: '/logo-deep-fc.gif',
  },
  {
    name: 'Nandark',
    roleKey: 'nandarkRole',
    imageSrc: '/nandark-isotipo.png',
  },
  {
    name: 'Tory Skateshop',
    roleKey: 'torySkateshopRole',
    imageSrc: '/logo-tory.jpg',
  },
];

const Partners = () => {
  const t = useTranslations('partnersComponent');

  return (
    <section
      id="team"
      className="relative py-20 md:py-24 bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 overflow-hidden"
    >
      {/* Decorative background blurs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-accent-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container xl:max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <header className="text-center mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-accent-cyan-400 uppercase tracking-wider mb-4">
            <span className="font-light text-neutral-300">{t('our')}</span>{' '}
            {t('partners')}
          </h2>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 100 60"
            className="mx-auto h-10"
            aria-hidden="true"
          >
            <circle cx="50.1" cy="30.4" r="5" className="stroke-accent-cyan-400 fill-none stroke-2" />
            <line
              x1="55.1"
              y1="30.4"
              x2="100"
              y2="30.4"
              className="stroke-accent-cyan-400 stroke-2"
            />
            <line
              x1="45.1"
              y1="30.4"
              x2="0"
              y2="30.4"
              className="stroke-accent-cyan-400 stroke-2"
            />
          </svg>
        </header>

        {/* Partners grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {partners.map((partner, idx) => {
            const Wrapper = partner.website ? 'a' : 'div';
            const wrapperProps = partner.website
              ? {
                  href: partner.website,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                }
              : {};
            const isLast = idx === partners.length - 1;

            return (
              <Wrapper
                key={partner.name}
                {...wrapperProps}
                className={`group relative block bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-2xl shadow-2xl shadow-accent-cyan-500/20 hover:shadow-accent-cyan-500/50 transform hover:scale-105 transition-all duration-300 ${
                  isLast ? 'md:col-span-1 col-span-2 max-w-[calc(50%-0.5rem)] mx-auto' : ''
                }`}
              >
                <div className="bg-neutral-900 rounded-2xl p-4 md:p-10 flex flex-col items-center text-center h-full">
                  {/* Logo container with circular border */}
                  <div className="relative mb-6">
                    {/* Glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

                    {/* Logo */}
                    <div className="relative w-24 h-24 md:w-48 md:h-48 rounded-full bg-neutral-50 border-4 border-accent-cyan-400 group-hover:border-accent-cyan-300 overflow-hidden flex items-center justify-center transition-all">
                      <Image
                        width={200}
                        height={200}
                        src={partner.imageSrc}
                        alt={`${partner.name} logo`}
                        className="w-full h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Name + role */}
                  <p className="text-2xl md:text-3xl font-black text-accent-cyan-400 uppercase tracking-wider mb-2 group-hover:text-accent-cyan-300 transition-colors">
                    {partner.name}
                  </p>
                  <p className="text-neutral-400 text-sm md:text-base font-light">
                    {t(partner.roleKey)}
                  </p>

                  {/* Visit indicator — solo si tiene website */}
                  {partner.website && (
                    <div className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-500 group-hover:text-accent-cyan-400 uppercase tracking-wider font-bold transition-colors">
                      {t('visitSite') || 'VISIT SITE'}
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;
