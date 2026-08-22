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

        {/* Partners — estilo Instagram: círculos con nombre debajo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto md:justify-items-center">
          {partners.map((partner, idx) => {
            const Wrapper = partner.website ? 'a' : 'div';
            const wrapperProps = partner.website
              ? {
                  href: partner.website,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                }
              : {};
            // Centrar el último card (Tory) en desktop: en mobile sigue col-span-2
            const isLast = idx === partners.length - 1;

            return (
              <Wrapper
                key={partner.name}
                {...wrapperProps}
                className={`group flex flex-col items-center text-center ${
                  isLast ? 'col-span-2 md:col-span-1' : ''
                }`}
              >
                {/* Círculo del logo con border gradiente (cyan → verde tóxico → purple) */}
                <div className="relative w-32 h-32 md:w-44 md:h-44 mb-4">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-cyan-500 via-toxic-green-500 to-accent-purple-600 blur-lg opacity-40 group-hover:opacity-80 transition-opacity duration-300" />

                  {/* Border gradiente */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-cyan-500 via-toxic-green-500 to-accent-purple-600 p-[3px]">
                    <div className="w-full h-full rounded-full bg-neutral-50 overflow-hidden flex items-center justify-center">
                      <Image
                        width={200}
                        height={200}
                        src={partner.imageSrc}
                        alt={`${partner.name} logo`}
                        className="w-full h-full object-contain p-3 grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Name con detalle verde tóxico en hover */}
                <p className="text-base md:text-lg font-black text-accent-cyan-400 uppercase tracking-wider mb-1 group-hover:text-toxic-green-400 transition-colors">
                  {partner.name}
                </p>
                <p className="text-neutral-400 text-xs md:text-sm font-light">
                  {t(partner.roleKey)}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;
