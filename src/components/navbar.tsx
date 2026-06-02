'use client';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { MdAdminPanelSettings } from 'react-icons/md';
import { itemsNavbar } from '../../data';
import MotionTransition from './transition-component';
import { useTranslations } from 'next-intl';

const Navbar = () => {
  const router = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const t = useTranslations('navbarComponent');

  return (
    <MotionTransition
      position="right"
      className="fixed z-10 flex flex-col items-center justify-center w-full mt-auto  h-max bottom-10"
    >
      <nav>
        <div className="flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-white/15 background-blur-sm">
          {itemsNavbar.map((item) => (
            <div
              key={item.id}
              className={`
                        px-3 py-2 transition duration-150 rounded-full cursor-pointer
                        hover:bg-success-500 ${
                          router === item.link && 'bg-brand-pink'
                        }`}
            >
              <Link href={item.link}> {item.icon} </Link>
            </div>
          ))}

          {isAdmin && (
            <div
              className={`
                        px-3 py-2 transition duration-150 rounded-full cursor-pointer
                        hover:bg-red-500/50 ${
                          router === '/admin' && 'bg-red-500'
                        }`}
              title={t('adminPanel')}
            >
              <Link href="/admin">
                <MdAdminPanelSettings className="w-4 h-4 text-red-400" />
              </Link>
            </div>
          )}
        </div>
      </nav>
    </MotionTransition>
  );
};

export default Navbar;
