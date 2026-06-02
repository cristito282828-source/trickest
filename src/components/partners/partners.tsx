'use client';
import Image from 'next/image';
import styles from './Partners.module.css';
import { useTranslations } from 'next-intl';

const Partners = () => {
  const t = useTranslations('partnersComponent');

  const partners = [
    {
      name: 'DeepFC',
      roleKey: 'deepfcRole',
      imageSrc: '/logo-deep-fc.gif',
      website: 'https://deepfc.com/',
    },
    {
      name: 'Nandark',
      roleKey: 'nandarkRole',
      imageSrc: '/nandark-isotipo.png',
      website: 'https://nandark.com/',
    },
  ];

  return (
    <div>
      <div
        id="team"
        className={`section relative pt-20 pb-8 md:pt-16 bg-surface-deep ${styles.container}`}
      >
        <div
          className={`container xl:max-w-6xl mx-auto px-4 ${styles.teamContainer}`}
        >
          <header className="text-center mx-auto mb-12">
            <h2 className="text-2xl leading-normal mb-2 font-bold text-neutral-200">
              <span className="font-light">{t('our')}</span> {t('partners')}
            </h2>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 100 60"
              className={`mx-auto h-10 ${styles.svg}`}
            >
              <circle cx="50.1" cy="30.4" r="5" className="stroke-primary" />
              <line
                x1="55.1"
                y1="30.4"
                x2="100"
                y2="30.4"
                className="stroke-primary"
              />
              <line
                x1="45.1"
                y1="30.4"
                x2="0"
                y2="30.4"
                className="stroke-primary"
              />
            </svg>
          </header>

          <div
            className={`flex flex-wrap flex-row -mx-4 justify-center ${styles.team}`}
          >
            <div
              className={`flex flex-wrap flex-row -mx-4 justify-center ${styles.team}`}
            >
              {partners.map((partner, index) => (
                <div
                  key={index}
                  className={`flex-shrink max-w-full px-4 w-2/3 sm:w-1/2 md:w-5/12 lg:w-1/4 xl:px-6 ${styles.profile}`}
                >
                  <div
                    className={`relative overflow-hidden bg-neutral-800/50 mb-12 hover-grayscale-0 wow fadeInUp ${styles.profileContainer}`}
                  >
                    <div
                      className={`relative overflow-hidden px-6 ${styles.imageContainer}`}
                    >
                      <Image
                        width={80}
                        height={80}
                        src={partner.imageSrc}
                        className="max-w-full h-auto mx-auto rounded-full bg-neutral-50 grayscale"
                        alt="title image"
                      />
                    </div>
                    <div className="pt-6 text-center">
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <p className="text-neutral-200 text-lg leading-normal font-bold mb-1">
                          {partner.name}
                        </p>
                        <p className="text-neutral-400 leading-relaxed font-light">
                          {t(partner.roleKey)}
                        </p>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;
