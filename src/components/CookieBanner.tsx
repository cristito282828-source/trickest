'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Cookie Consent Banner
 * Compliant with GDPR and CCPA
 */
export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if user already consented
    const savedConsent = localStorage.getItem('cookie_consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      setConsent(JSON.parse(savedConsent));
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    saveConsent(newConsent);
  };

  const handleAcceptNecessary = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    saveConsent(newConsent);
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  const saveConsent = (newConsent: CookieConsent) => {
    setConsent(newConsent);
    localStorage.setItem('cookie_consent', JSON.stringify(newConsent));
    setShowBanner(false);

    // Update dataLayer for Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: newConsent.analytics ? 'granted' : 'denied',
        ad_storage: newConsent.marketing ? 'granted' : 'denied',
        ad_user_data: newConsent.marketing ? 'granted' : 'denied',
        ad_personalization: newConsent.marketing ? 'granted' : 'denied'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-neutral-900/95 backdrop-blur-sm border-t-4 border-accent-cyan-500 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Text */}
          <div className="flex-1 text-white">
            <h3 className="text-lg font-bold mb-2">🍪 {t('title')}</h3>
            <p className="text-sm text-neutral-300 mb-2">
              {t('description')}
            </p>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-accent-cyan-500 hover:text-accent-cyan-400 text-sm underline"
            >
              {showSettings ? t('hideSettings') : t('customize')}
            </button>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="bg-neutral-800 p-4 rounded-lg border-2 border-neutral-700 mb-4 md:mb-0">
              <div className="space-y-3">
                {/* Necessary */}
                <label className="flex items-center gap-3 text-white text-sm cursor-not-allowed opacity-50">
                  <input
                    type="checkbox"
                    checked={consent.necessary}
                    disabled
                    className="w-4 h-4"
                  />
                  <span>{t('necessary')}</span>
                </label>

                {/* Analytics */}
                <label className="flex items-center gap-3 text-white text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>{t('analytics')}</span>
                </label>

                {/* Marketing */}
                <label className="flex items-center gap-3 text-white text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>{t('marketing')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          {!showSettings ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptNecessary}
                className="px-6 py-2 rounded-lg border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition font-bold text-sm uppercase"
              >
                {t('necessaryOnly')}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 rounded-lg bg-accent-purple-600 hover:bg-accent-purple-700 text-white transition font-bold text-sm uppercase"
              >
                {t('acceptAll')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 rounded-lg bg-accent-cyan-500 hover:bg-accent-cyan-600 text-white transition font-bold text-sm uppercase"
            >
              {t('savePreferences')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
