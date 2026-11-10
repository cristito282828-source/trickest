'use client';

import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { FaInstagram, FaFacebook } from 'react-icons/fa';

/**
 * Minimal Arcade-style Footer with legal links
 */
const Footer = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const t = useTranslations('footer');

  return (
    <footer className="bg-neutral-900 border-t-4 border-accent-cyan-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col items-center gap-3 text-xs sm:flex-row sm:justify-between">
          <div className="text-neutral-500 font-mono">
            © {new Date().getFullYear()} TRICKEST
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/thetrickest/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-neutral-500 hover:text-pink-500 transition-colors"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/thetrickest/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-neutral-500 hover:text-blue-500 transition-colors"
              >
                <FaFacebook size={18} />
              </a>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono">
              <Link
                href="/privacy"
                className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
              >
                {t('privacy')}
              </Link>
              <Link
                href="/terms"
                className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
              >
                {t('terms')}
              </Link>
              <Link
                href="/cookies"
                className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
              >
                {t('cookies')}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider text-[10px]"
                >
                  {t('admin')}
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
