'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BackButton from '@/components/atoms/BackButton';
import SkateSetupPage from './dream_setup';
import GeneralInfoForm from './general_info_form';

export default function ProfilePage() {
  const t = useTranslations('profilePage');
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'setup' | 'social'>(
    'general'
  ); // Active tab
  const [formData, setFormData] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
  });
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Function to share profile
  const handleShareProfile = async () => {
    if (!session?.user?.username) return;
    const profileUrl = `${window.location.origin}/profile/${session.user.username}`;

    // If browser supports Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${session.user.username}'s Profile - Thetrickest`,
          text: t('shareText'),
          url: profileUrl,
        });
        return; // Share successful, exit
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      setNotification(`✅ ${t('linkCopied')}`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      // If clipboard fails, create a temporary input element
      const input = document.createElement('input');
      input.value = profileUrl;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        setNotification(`✅ ${t('linkCopied')}`);
        setTimeout(() => setNotification(''), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
        setNotification(`❌ ${t('copyFailed')}`);
        setTimeout(() => setNotification(''), 3000);
      }
      document.body.removeChild(input);
    }
  };

  // Functions to share on specific social networks
  const shareOnFacebook = () => {
    if (!session?.user?.username) return;
    const profileUrl = `${window.location.origin}/profile/${session.user.username}`;
    // Facebook Share Dialog (reemplaza al legacy sharer.php que ya no soporta Open Graph)
    // Documentación: https://developers.facebook.com/docs/sharing/reference/share-dialog
    window.open(
      `https://www.facebook.com/dialog/share?app_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}&display=popup&href=${encodeURIComponent(
        profileUrl
      )}&redirect_uri=${encodeURIComponent(profileUrl)}`,
      '_blank',
      'width=600,height=600'
    );
  };

  const shareOnTwitter = () => {
    if (!session?.user?.username) return;
    const profileUrl = `${window.location.origin}/profile/${session.user.username}`;
    const text = `${t('shareText')} 🛹`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(profileUrl)}`,
      '_blank'
    );
  };

  const shareOnWhatsApp = () => {
    if (!session?.user?.username) return;
    const profileUrl = `${window.location.origin}/profile/${session.user.username}`;
    const text = `${t('shareText')} 🛹 ${profileUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Check if we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showShareMenu && !target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // Load profile data when user is authenticated
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/skate_profiles/social_media?email=${session.user?.email}`
        );
        const data = await response.json();
        console.log('Data received:', data);

        // If user has no social media (404), leave fields empty
        if (response.status === 404 || !data.exists) {
          console.log(
            'New user without social media, empty fields by default'
          );
          setFormData({
            facebook: '',
            instagram: '',
            tiktok: '',
            twitter: '',
          });
          return;
        }

        // If there's a real server error (500), show notification
        if (!response.ok) {
          throw new Error('Server error while fetching profile.');
        }

        // Adjust assignment to use data.socialMedia
        setFormData({
          facebook: data.socialMedia?.facebook || '',
          instagram: data.socialMedia?.instagram || '',
          tiktok: data.socialMedia?.tiktok || '',
          twitter: data.socialMedia?.twitter || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setNotification(`❌ ${t('errorLoading')}`);
        // Auto-clear error notification after 5 seconds
        setTimeout(() => {
          setNotification('');
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [status, session?.user?.email]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setNotification(''); // Reset notification before sending

    if (!session?.user) {
      console.error('Not authenticated');
      setNotification(`❌ ${t('notAuthenticated')}`);
      setLoading(false);
      return;
    }

    const jsonData = {
      userId: session.user.email,
      facebook: formData.facebook,
      instagram: formData.instagram,
      twitter: formData.twitter,
      tiktok: formData.tiktok,
    };
    console.log('JSON data to send:', jsonData);

    try {
      const response = await fetch('/api/skate_profiles/social_media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          tiktok: formData.tiktok,
          userId: session.user.email,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Registration successful:', data);
      setIsRegistered(true);
      setNotification(`✅ ${t('settingsUpdated')}`); // Success notification

      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification('');
      }, 5000);
    } catch (error) {
      console.error('Error registering:', error);
      setNotification(`❌ ${t('errorUpdating')}`); // Error notification
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header with retro effect */}
      <div className="max-w-7xl mx-auto mb-8 relative z-50">
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Back button - visible on mobile */}
                <div className="md:hidden">
                  <BackButton variant="minimal" fallbackHref="/" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-black text-accent-cyan-400 uppercase tracking-wider text-center md:text-left">
                    {`🎮 ${t('title')}`}
                  </h1>
                </div>
              </div>
              {session?.user?.username && (
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto relative z-50">
                  <Link
                    href={`/profile/${session.user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent-purple-600 hover:bg-accent-purple-700 text-white font-black py-2 px-4 rounded-lg border-2 border-white uppercase tracking-wider text-xs shadow-lg transform hover:scale-105 transition-all text-center whitespace-nowrap relative z-50"
                  >
                    {`👁️ ${session.user.username}`}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Arcade style tabs system */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 font-black uppercase tracking-wider transition-all transform hover:scale-105 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-accent-cyan-500 to-accent-blue-500 text-white shadow-lg shadow-accent-cyan-500/50 border-4 border-accent-cyan-300'
                : 'bg-neutral-800 text-neutral-400 border-4 border-neutral-700 hover:border-accent-cyan-500'
            } rounded-lg text-sm md:text-base`}
          >
            {`👤 ${t('tabGeneral')}`}
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 font-black uppercase tracking-wider transition-all transform hover:scale-105 ${
              activeTab === 'setup'
                ? 'bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 text-white shadow-lg shadow-accent-purple-500/50 border-4 border-accent-purple-300'
                : 'bg-neutral-800 text-neutral-400 border-4 border-neutral-700 hover:border-accent-purple-500'
            } rounded-lg text-sm md:text-base`}
          >
            {`🛹 ${t('tabSetup')}`}
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-6 font-black uppercase tracking-wider transition-all transform hover:scale-105 ${
              activeTab === 'social'
                ? 'bg-gradient-to-r from-green-500 to-accent-teal-500 text-white shadow-lg shadow-green-500/50 border-4 border-green-300'
                : 'bg-neutral-800 text-neutral-400 border-4 border-neutral-700 hover:border-green-500'
            } rounded-lg text-sm md:text-base`}
          >
            {`🌐 ${t('tabSocial')}`}
          </button>
        </div>
      </div>

      {/* Floating notification */}
      {notification && (
        <div
          className={`max-w-7xl mx-auto mb-6 animate-pulse ${
            notification.includes('✅') ? 'bg-green-500' : 'bg-red-500'
          } border-4 border-white rounded-lg p-4 shadow-2xl`}
        >
          <p className="text-white font-bold text-center text-sm md:text-base">
            {notification}
          </p>
        </div>
      )}

      {/* Tab content */}
      <div className="max-w-7xl mx-auto">
        {/* Tab: General Info */}
        {activeTab === 'general' && (
          <div className="animate-fadeIn">
            <GeneralInfoForm />
          </div>
        )}

        {/* Tab: Dream Setup */}
        {activeTab === 'setup' && (
          <div className="animate-fadeIn">
            <SkateSetupPage />
          </div>
        )}

        {/* Tab: Social Media */}
        {activeTab === 'social' && (
          <div className="animate-fadeIn">
            <div className="bg-gradient-to-r from-green-500 to-accent-teal-500 p-1 rounded-lg shadow-2xl">
              <div className="bg-neutral-900 rounded-lg p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-accent-teal-400 uppercase mb-6 text-center md:text-left">
                  {`🌐 ${t('connectSocial')}`}
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Facebook */}
                    <div className="group">
                      <label className="text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base flex items-center gap-2">
                        <span className="text-xl">📘</span> Facebook
                      </label>
                      <input
                        className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white placeholder-neutral-400 focus:border-accent-blue-500 focus:outline-none transition-all group-hover:border-accent-blue-400"
                        type="text"
                        id="facebook"
                        name="facebook"
                        placeholder={t('profilePlaceholder')}
                        value={formData.facebook}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Instagram */}
                    <div className="group">
                      <label className="text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base flex items-center gap-2">
                        <span className="text-xl">📷</span> Instagram
                      </label>
                      <input
                        className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white placeholder-neutral-400 focus:border-accent-pink-500 focus:outline-none transition-all group-hover:border-accent-pink-400"
                        type="text"
                        id="instagram"
                        name="instagram"
                        placeholder={t('userPlaceholder')}
                        value={formData.instagram}
                        onChange={handleChange}
                      />
                    </div>

                    {/* TikTok */}
                    <div className="group">
                      <label className="text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base flex items-center gap-2">
                        <span className="text-xl">🎵</span> TikTok
                      </label>
                      <input
                        className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white placeholder-neutral-400 focus:border-accent-teal-500 focus:outline-none transition-all group-hover:border-accent-teal-400"
                        type="text"
                        id="tiktok"
                        name="tiktok"
                        placeholder={t('userPlaceholder')}
                        value={formData.tiktok}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Twitter/X */}
                    <div className="group">
                      <label className="text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base flex items-center gap-2">
                        <span className="text-xl">𝕏</span> Twitter / X
                      </label>
                      <input
                        className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white placeholder-neutral-400 focus:border-accent-cyan-500 focus:outline-none transition-all group-hover:border-accent-cyan-400"
                        type="text"
                        id="twitter"
                        name="twitter"
                        placeholder={t('userPlaceholder')}
                        value={formData.twitter}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Arcade style save button */}
                  <div className="flex justify-center mt-8">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-12 rounded-lg border-4 border-white uppercase tracking-wider text-lg shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? `⏳ ${t('saving')}` : `💾 ${t('save')}`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
