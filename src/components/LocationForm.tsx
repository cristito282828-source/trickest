'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function LocationForm() {
  const { data: session } = useSession();
  const t = useTranslations('locationForm');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    ciudad: string;
    showOnMap: boolean;
  }>({
    latitude: null,
    longitude: null,
    ciudad: '',
    showOnMap: false,
  });

  // Load existing location data
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/user/location?email=${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          setLocationData({
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            ciudad: data.ciudad || '',
            showOnMap: data.showOnMap || false,
          });
        }
      } catch (error) {
        console.error('Error loading location:', error);
      }
    };

    fetchLocation();
  }, [session?.user?.email]);

  // Activate GPS location
  const handleActivateLocation = () => {
    if (!navigator.geolocation) {
      setNotification(`❌ ${t('noGeolocation')}`);
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          ...locationData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setNotification(`✅ ${t('locationObtained')}`);
        setTimeout(() => setNotification(''), 3000);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setNotification(`❌ ${t('errorGettingLocation')}`);
        setTimeout(() => setNotification(''), 5000);
        setLoading(false);
      }
    );
  };

  // Save configuration
  const handleSave = async () => {
    setLoading(true);
    setNotification('');

    if (!session?.user?.email) {
      setNotification(`❌ ${t('notAuthenticated')}`);
      setLoading(false);
      return;
    }

    if (locationData.showOnMap && (!locationData.latitude || !locationData.longitude)) {
      setNotification(`❌ ${t('mustActivateLocation')}`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          ciudad: locationData.ciudad,
          departamento: null,
          estado: null,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          showOnMap: locationData.showOnMap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error updating location');
      }

      setNotification(`✅ ${t('configSaved')}`);
      setTimeout(() => setNotification(''), 5000);
    } catch (error) {
      console.error('Error:', error);
      setNotification(`❌ ${t('errorSaving')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl">
      <div className="bg-neutral-900 rounded-lg p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase mb-4">
            {`📍 ${t('title')}`}
          </h2>
          <p className="text-neutral-300 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 animate-pulse ${
              notification.includes('✅') ? 'bg-green-500' : 'bg-red-500'
            } border-4 border-white rounded-lg p-4 shadow-2xl`}
          >
            <p className="text-white font-bold text-center text-base">
              {notification}
            </p>
          </div>
        )}

        {/* Activate location button */}
        <div className="mb-8">
          <button
            onClick={handleActivateLocation}
            disabled={loading}
            className="w-full bg-accent-yellow-500 hover:bg-accent-yellow-600 text-white font-black py-6 px-8 rounded-xl border-4 border-white uppercase tracking-wider text-xl shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>{`⏳ ${t('gettingLocation')}`}</>
            ) : locationData.latitude && locationData.longitude ? (
              <>{`✅ ${t('locationActivated')}`}</>
            ) : (
              <>{`🌍 ${t('activateMyLocation')}`}</>
            )}
          </button>
        </div>

        {/* Location info obtained */}
        {locationData.latitude && locationData.longitude && (
          <div className="bg-neutral-800 border-4 border-green-500 rounded-xl p-6 mb-8">
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✅</div>
              <h3 className="text-white font-black text-xl uppercase mb-3">
                {t('locationDetected')}
              </h3>
              <div className="text-neutral-300 space-y-2">
                <p className="font-bold">
                  {`📍 ${t('coordinates')}:`} {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
                </p>
                {locationData.ciudad && (
                  <p className="font-bold">
                    {`🏙️ ${t('cityLabel')}:`} {locationData.ciudad}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toggle to appear on map */}
        <div className="bg-accent-purple-900/40 border-4 border-accent-purple-500 rounded-xl p-6 mb-8">
          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={locationData.showOnMap}
              onChange={(e) => setLocationData({ ...locationData, showOnMap: e.target.checked })}
              className="w-7 h-7 accent-purple-500 cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-white font-black text-lg uppercase tracking-wide">
                {`🗺️ ${t('appearOnMap')}`}
              </p>
              <p className="text-neutral-400 text-sm mt-1">
                {t('appearOnMapDesc')}
              </p>
            </div>
          </label>
        </div>

        {/* Save button */}
        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-accent-purple-600 hover:bg-accent-purple-700 text-white font-black py-5 px-16 rounded-xl border-4 border-white uppercase tracking-wider text-xl shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `⏳ ${t('saving')}` : `💾 ${t('save')}`}
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-8 text-center">
          <p className="text-neutral-400 text-sm">
            💡 <strong>Tip:</strong> {t('tip')}
          </p>
        </div>
      </div>
    </div>
  );
}
