'use client';

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import SpotProximityModal from '@/components/SpotProximityModal';
import SpotFloatingButton from '@/components/SpotFloatingButton';
import { SpotComments } from '@/components/organisms';
import { useTranslations } from 'next-intl';

// Dynamic import of UnifiedMap to avoid SSR issues
const UnifiedMap = dynamic(() => import('@/components/organisms/UnifiedMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-xl border-4 border-accent-cyan-400 bg-neutral-900 flex items-center justify-center">
      <div className="text-accent-cyan-400 font-black text-xl animate-pulse">
        🗺️ LOADING MAP...
      </div>
    </div>
  ),
});

interface Spot {
  id: number;
  name: string;
  type: 'skatepark' | 'skateshop';
  description?: string;
  address?: string;
  city?: string;
  latitude: number;
  longitude: number;
  instagram?: string;
  phone?: string;
  website?: string;
  isVerified: boolean;
  rating?: number;
}

export default function SpotsPage() {
  const t = useTranslations('spotsPage');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'skatepark' | 'skateshop'>('all');
  const [filterVerified, setFilterVerified] = useState(false);
  const [showProximityModal, setShowProximityModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    fetchSpots();
  }, [filterType, filterVerified]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      if (filterVerified) {
        params.append('verified', 'true');
      }

      const response = await fetch(`/api/spots?${params.toString()}`);
      const data = await response.json();

      if (data.spots) {
        setSpots(data.spots);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpotRegistered = () => {
    // Refresh the spots list
    fetchSpots();
  };

  const handleSpotValidated = () => {
    // Show toast message
    setToastMessage(`✅ ${t('spotValidated')}`);
    fetchSpots();

    // Hide toast after 3 seconds
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleProximityAction = () => {
    setShowProximityModal(true);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
  };

  const handleViewAllComments = () => {
    // Scroll to comments section
    setTimeout(() => {
      const commentsSection = document.getElementById('comments-section');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-4">
            <span className="bg-gradient-to-r from-accent-cyan-400 to-accent-purple-600 text-transparent bg-clip-text">
              {`🗺️ ${t('title')}`}
            </span>
          </h1>
          <p className="text-xl text-neutral-300 font-bold">
            {t('subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl p-6 mb-6 shadow-2xl shadow-accent-cyan-500/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Type filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
                {`🎯 ${t('spotType')}`}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
              >
                <option value="all">{t('all')}</option>
                <option value="skatepark">{`🛹 ${t('skateparks')}`}</option>
                <option value="skateshop">{`🏪 ${t('skateshops')}`}</option>
              </select>
            </div>

            {/* Verified filter */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.checked)}
                  className="w-5 h-5 accent-green-500"
                />
                <span className="text-white font-bold">
                  {`✓ ${t('verifiedOnly')}`}
                </span>
              </label>
            </div>

            {/* Counter */}
            <div className="ml-auto">
              <div className="bg-accent-purple-600 px-4 py-2 rounded-lg border-2 border-accent-purple-400">
                <span className="text-white font-black">
                  {spots.length} {spots.length === 1 ? t('spot') : t('spots')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        {loading ? (
          <div className="w-full h-[600px] rounded-xl border-4 border-accent-cyan-400 bg-neutral-900 flex items-center justify-center">
            <div className="text-accent-cyan-400 font-black text-2xl animate-pulse">
              {`⏳ ${t('loadingSpots')}`}
            </div>
          </div>
        ) : (
          <>
            {spots.length === 0 && (
              <div className="mb-4 bg-accent-yellow-900/30 border-2 border-accent-yellow-500 rounded-lg p-4">
                <p className="text-accent-yellow-300 font-bold text-center">
                  {`🤷‍♂️ ${t('noSpotsFound')}`}{filterType !== 'all' && ` ${t('ofType', { type: filterType })}`}
                </p>
                <p className="text-neutral-400 text-sm text-center mt-1">
                  {t('addFirstSpot')}
                </p>
              </div>
            )}
            <UnifiedMap
              spots={spots}
              height="600px"
              showSkaters={false}
              onSpotValidated={handleSpotValidated}
              onSpotClick={handleSpotClick}
              onViewAllComments={handleViewAllComments}
            />
          </>
        )}

        {/* Comments section - shows when a spot is selected */}
        {selectedSpot && (
          <div id="comments-section" className="mt-8 bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl p-6 shadow-2xl shadow-accent-cyan-500/30">
            {/* Header with spot name and close button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-accent-cyan-400">
                  {`💬 ${t('comments')}`}
                </h2>
                <p className="text-sm text-neutral-300 mt-1">
                  {selectedSpot.name} ({selectedSpot.type === 'skatepark' ? `🛹 ${t('skatepark')}` : `🏪 ${t('skateshop')}`})
                </p>
              </div>
              <button
                onClick={() => setSelectedSpot(null)}
                className="p-2 bg-neutral-700 hover:bg-neutral-600 border-2 border-neutral-500 rounded-lg transition-colors"
                title={t('closeComments')}
              >
                <X className="w-5 h-5 text-neutral-300" />
              </button>
            </div>

            <SpotComments spotId={selectedSpot.id} maxHeight="400px" />
          </div>
        )}

        {/* Additional info */}
        <div className="mt-8 bg-neutral-800 border-4 border-accent-purple-400 rounded-xl p-6 shadow-2xl shadow-accent-purple-500/30">
          <h2 className="text-2xl font-black uppercase text-accent-purple-300 mb-4">
            {`💡 ${t('howToUseMap')}`}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-neutral-300">
            <div>
              <p className="font-bold mb-2">🛹 <span className="text-accent-cyan-400">{t('blueIcons')}</span> = Skateparks</p>
              <p className="text-sm">{t('blueIconsDesc')}</p>
            </div>
            <div>
              <p className="font-bold mb-2">🏪 <span className="text-accent-pink-400">{t('pinkIcons')}</span> = Skateshops</p>
              <p className="text-sm">{t('pinkIconsDesc')}</p>
            </div>
            <div>
              <p className="font-bold mb-2">✓ <span className="text-green-400">{t('greenCheck')}</span> = Verified</p>
              <p className="text-sm">{t('greenCheckDesc')}</p>
            </div>
            <div>
              <p className="font-bold mb-2">💬 <span className="text-accent-cyan-400">{t('clickOnMarker')}</span> = View comments</p>
              <p className="text-sm">{t('clickOnMarkerDesc')}</p>
            </div>
          </div>
        </div>

        {/* Floating button hint */}
        <div className="mt-6 text-center">
          <p className="text-accent-cyan-400 font-bold text-sm flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 animate-bounce" />
            {t('floatingButtonHint')}
          </p>
        </div>
      </div>

      {/* Proximity floating button - disabled when modal is open */}
      {!showProximityModal && <SpotFloatingButton onClick={handleProximityAction} />}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-40 bg-green-600 text-white px-6 py-3 rounded-lg border-2 border-green-400 shadow-xl animate-pulse">
          <p className="font-bold text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Proximity modal */}
      <SpotProximityModal
        isOpen={showProximityModal}
        onClose={() => setShowProximityModal(false)}
        onSpotRegistered={handleSpotRegistered}
        onSpotValidated={handleSpotValidated}
      />
    </div>
  );
}
