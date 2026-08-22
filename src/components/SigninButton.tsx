'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginEmailForm from './LoginEmailForm';
import RegisterEmailForm from './RegisterEmailForm';
import SetPasswordModal from './SetPasswordModal';
import SkateProfileCompletionModal from './SkateProfileCompletionModal';
import ModalPortal from './ModalPortal';

type MenuOption = {
  label: string;
  action: (() => void) | null;
  isHeader?: boolean;
  isPrimary?: boolean;
};

const SigninButton = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [openModal, setModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openSetPasswordModal, setOpenSetPasswordModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const t = useTranslations('signinMenu');

  // Escuchar eventos externos para abrir el modal de login (ej. desde PromoVideoModal)
  useEffect(() => {
    const onOpenSignin = () => {
      setShowLoginForm(true);
    };
    window.addEventListener('trickest:open-signin', onOpenSignin);
    return () => window.removeEventListener('trickest:open-signin', onOpenSignin);
  }, []);

  const handleModal = () => setModal(!openModal);
  const handleMenu = () => {
    setOpenMenu(!openMenu);
    setSelectedOption(0); // Reset selection when opening menu
  };

  const profileStatus = session?.user?.profileStatus || 'basic';
  const isProfileComplete = profileStatus === 'complete';
  const hasPassword = session?.user?.hasPassword;

  // States for login/register
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);

  // Check if we should show password reminder (once per week)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && hasPassword === false) {
      const lastReminder = localStorage.getItem('passwordReminderLastShown');
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      // Show reminder if never shown or more than a week ago
      if (!lastReminder || (now - parseInt(lastReminder)) > oneWeek) {
        setShowPasswordReminder(true);
      }
    }
  }, [session, hasPassword, status]);

  // Function to dismiss reminder and set for next week
  const dismissPasswordReminder = () => {
    localStorage.setItem('passwordReminderLastShown', Date.now().toString());
    setShowPasswordReminder(false);
  };

  // Function to scroll to partners
  const scrollToPartners = () => {
    const partnersSection = document.getElementById('team');
    if (partnersSection) {
      partnersSection.scrollIntoView({ behavior: 'smooth' });
    }
    handleMenu();
  };

  // Function to scroll to how to win section
  const scrollToHowToWin = () => {
    handleMenu();

    // Check if we're on the home page
    const pathSegments = pathname.split('/').filter(Boolean);
    const isHomepage = pathSegments.length <= 1;

    if (isHomepage) {
      // We're on the home page, scroll to the section
      setTimeout(() => {
        const howToWinSection = document.getElementById('how-to-win');
        if (howToWinSection) {
          howToWinSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // We're on another page, navigate to home then scroll
      window.location.href = '/#how-to-win';
    }
  };

  // PS2 style menu options
  const menuOptions: MenuOption[] = session?.user
    ? [
        {
          label: isProfileComplete ? t('continue') : t('completeProfile'),
          action: () => {
            handleMenu();
            isProfileComplete
              ? (window.location.href = '/dashboard/skaters/profile')
              : handleModal();
          },
        },
        { label: t('partners'), action: scrollToPartners },
        {
          label: t('howToPlay'),
          action: scrollToHowToWin,
        },
        {
          label: '👤 ' + (session.user.name?.toUpperCase() || 'PLAYER'),
          action: null,
          isHeader: true,
        },
        {
          label: t('logout'),
          action: () => {
            handleMenu();
            signOut();
          },
        },
      ]
    : [
        {
          label: t('loginGoogle'),
          action: () => {
            handleMenu();
            signIn('google');
          },
          isPrimary: true,
        },
        {
          label: t('loginEmail'),
          action: () => {
            handleMenu();
            setShowLoginForm(true);
          },
        },
        {
          label: t('createAccount'),
          action: () => {
            handleMenu();
            setShowRegisterForm(true);
          },
        },
        { label: t('partners'), action: scrollToPartners },
        {
          label: t('howToPlay'),
          action: scrollToHowToWin,
        },
      ];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Close modals with ESC
      if (e.key === 'Escape') {
        if (openMenu) handleMenu();
        else if (openModal) handleModal();
        return;
      }

      // Menu navigation only if open and no other modals
      if (openMenu && !openModal) {
        if (e.key === 'ArrowUp') {
          setSelectedOption((prev) =>
            prev > 0 ? prev - 1 : menuOptions.length - 1
          );
        } else if (e.key === 'ArrowDown') {
          setSelectedOption((prev) =>
            prev < menuOptions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'Enter') {
          const option = menuOptions[selectedOption];
          if (option.action && !option.isHeader) option.action();
        }
      }
    };

    // Listen for arcade button events
    const handleArcadeStart = () => {
      if (!openMenu && !openModal) {
        handleMenu();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('arcade-press-start', handleArcadeStart);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('arcade-press-start', handleArcadeStart);
    };
  }, [selectedOption, menuOptions, openMenu, openModal]);

  return (
    <>
      {/* PS2/Xbox Style Menu Modal */}
      {openMenu && (
        <ModalPortal>
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-[9999] p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-black border-4 border-accent-cyan-400 rounded-lg shadow-2xl shadow-accent-cyan-500/50 relative my-auto max-h-[90vh] flex flex-col">
            {/* Menu header */}
            <div className="bg-gradient-to-r from-accent-cyan-600 to-accent-blue-600 p-4 md:p-6 rounded-t-lg border-b-4 border-accent-cyan-300 flex-shrink-0">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest text-center animate-pulse">
                {session?.user ? t('activePlayer') : t('mainMenu')}
              </h2>
              {session?.user && (
                <p className="text-accent-cyan-200 text-xs md:text-sm mt-2 text-center">
                  ⚡{' '}
                  {profileStatus === 'complete'
                    ? t('profileComplete')
                    : t('profileBasic')}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleMenu}
              className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold w-10 h-10 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-all"
            >
              ✖
            </button>

            {/* Menu options - With internal scroll */}
            <div className="p-6 space-y-2 overflow-y-auto flex-1">
              {menuOptions.map((option, index) => {
                const isSelected = index === selectedOption;
                const isHeader = option.isHeader;
                const isPrimary = option.isPrimary;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      !isHeader && option.action && option.action()
                    }
                    onMouseEnter={() => setSelectedOption(index)}
                    disabled={isHeader}
                    className={`w-full text-left px-4 py-3 md:py-4 rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${
                      isHeader
                        ? 'bg-accent-purple-900/50 text-accent-purple-300 cursor-default border-2 border-accent-purple-700'
                        : isPrimary
                        ? isSelected
                          ? 'bg-green-600 text-white scale-105 shadow-lg shadow-green-500/50 border-4 border-white'
                          : 'bg-green-700 hover:bg-green-600 text-white hover:scale-105 border-4 border-green-400'
                        : isSelected
                        ? 'bg-gradient-to-r from-accent-cyan-600 to-accent-blue-600 text-white scale-105 shadow-lg shadow-accent-cyan-500/50 border-4 border-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-4 border-neutral-600 hover:border-accent-cyan-500'
                    } text-sm md:text-base`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          isSelected && !isHeader ? 'animate-pulse' : ''
                        }
                      >
                        {isSelected && !isHeader ? '▶ ' : '　'}
                        {option.label}
                      </span>
                      {isSelected && !isHeader && (
                        <span className="text-xs md:text-sm opacity-75">
                          ENTER
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer with controls */}
            <div className="p-4 border-t-4 border-neutral-700 bg-neutral-900/50 rounded-b-lg text-center flex-shrink-0">
              <p className="text-accent-cyan-300 text-[10px] md:text-xs uppercase tracking-wide">
                {t('controls')}
              </p>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal to complete registration */}
      {openModal && (
        <ModalPortal>
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-[9999] p-4">
          <div className="w-full max-w-lg bg-gradient-to-b from-neutral-900 to-black border-4 border-accent-purple-500 rounded-lg shadow-2xl shadow-accent-purple-500/50 relative">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-accent-purple-600 to-accent-pink-600 p-4 rounded-t-lg border-b-4 border-accent-purple-300">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-center">
                ⚡ {t('completeProfileTitle')}
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={handleModal}
              className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold w-10 h-10 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-all"
            >
              ✖
            </button>

            {/* Modal content */}
            <div className="p-6">
              <SkateProfileCompletionModal
                openModal={openModal}
                handleModal={handleModal}
              />
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Set password modal (Google users) - only for setup */}
      <SetPasswordModal
        isOpen={openSetPasswordModal}
        onClose={() => setOpenSetPasswordModal(false)}
        onSuccess={() => {
          // Reload session to update hasPassword
          window.location.reload();
        }}
      />

      {/* Password Reminder Modal (shown weekly) */}
      {showPasswordReminder && (
        <ModalPortal>
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-[9999] p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-black border-4 border-accent-yellow-500 rounded-lg shadow-2xl shadow-accent-yellow-500/50 relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-yellow-600 p-4 rounded-t-lg border-b-4 border-accent-yellow-400">
              <h2 className="text-lg md:text-xl font-black text-neutral-900 uppercase tracking-wider text-center">
                🔐 SEGURIDAD DE CUENTA
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={dismissPasswordReminder}
              className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold w-8 h-8 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-all text-sm"
              type="button"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-white mb-4">
                ¿Sabías que puedes proteger tu cuenta aún más?
              </h3>
              <p className="text-neutral-300 mb-6">
                Añade una contraseña a tu cuenta para acceder incluso sin conexión a Google.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowPasswordReminder(false);
                    setOpenSetPasswordModal(true);
                  }}
                  className="w-full bg-accent-yellow-500 hover:bg-accent-yellow-600 text-neutral-900 font-bold py-3 px-6 rounded-lg border-4 border-accent-yellow-400 transition-all"
                >
                  CREAR CONTRASEÑA
                </button>
                <button
                  onClick={dismissPasswordReminder}
                  className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg border-4 border-neutral-500 transition-all"
                >
                  RECORDAR MÁS TARDE
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-4 border-neutral-700 bg-neutral-900/50 rounded-b-lg text-center">
              <p className="text-neutral-400 text-xs">
                Te recordaremos nuevamente en 7 días
              </p>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Email Login Modal */}
      <LoginEmailForm
        isOpen={showLoginForm}
        onClose={() => setShowLoginForm(false)}
        onSuccess={() => {
          setShowLoginForm(false);
          window.location.reload(); // Reload to show badge
        }}
        onSwitchToRegister={() => {
          setShowLoginForm(false);
          setShowRegisterForm(true);
        }}
      />

      {/* Email Register Modal */}
      <RegisterEmailForm
        isOpen={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
        onSuccess={() => {
          setShowRegisterForm(false);
          window.location.reload(); // Reload to show badge
        }}
        onSwitchToLogin={() => {
          setShowRegisterForm(false);
          setShowLoginForm(true);
        }}
      />

    </>
  );
};

export default SigninButton;
