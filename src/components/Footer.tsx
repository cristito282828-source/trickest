'use client';

import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

/**
 * Minimal Arcade-style Footer with legal links
 */
const Footer = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const t = useTranslations('footer');

  return (
    <footer className="bg-neutral-900 border-t-4 border-accent-cyan-500 mt-auto relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          {/* Copyright */}
          <div className="text-neutral-500 font-mono">
            © {new Date().getFullYear()} TRICKEST
          </div>

          {/* Legal Links */}
          <div className="flex gap-4 font-mono">
            <Link
              href="/privacy"
              className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
            >
              {t('privacy')}
            </Link>
            <span className="text-neutral-700">|</span>
            <Link
              href="/terms"
              className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
            >
              {t('terms')}
            </Link>
            <span className="text-neutral-700">|</span>
            <Link
              href="/cookies"
              className="text-neutral-500 hover:text-accent-cyan-500 transition-colors uppercase tracking-wider text-[10px]"
            >
              {t('cookies')}
            </Link>

            {/* Admin link - visible only to admins */}
            {isAdmin && (
              <>
                <span className="text-neutral-700">|</span>
                <Link
                  href="/admin"
                  className="text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider text-[10px]"
                >
                  {t('admin')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
