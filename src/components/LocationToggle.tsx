'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function LocationToggle() {
  const { data: session } = useSession();
  const t = useTranslations('locationToggle');
  const [loading, setLoading] = useState(false);
  const [showOnMap, setShowOnMap] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  // Load current state
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchLocationStatus = async () => {
      try {
        const response = await fetch(`/api/user/location?email=${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          setShowOnMap(data.showOnMap || false);
          setHasLocation(!!(data.latitude && data.longitude));
        }
      } catch (error) {
        console.error('Error loading location status:', error);
      }
    };

    fetchLocationStatus();
  }, [session?.user?.email]);

  // Toggle location
  const handleToggle = async () => {
    if (!session?.user?.email) {
      console.log('[LocationToggle] No session');
      return;
    }

    console.log('[LocationToggle] Toggle clicked:', { hasLocation, showOnMap });

    // If no saved location, request it first
    if (!hasLocation && !showOnMap) {
      console.log('[LocationToggle] No location, requesting GPS...');
      if (!navigator.geolocation) {
        alert('❌ ' + t('noGeolocation'));
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('[LocationToggle] GPS obtained:', position.coords);
            // Save location and activate showOnMap
            const response = await fetch('/api/user/location', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
                ciudad: '',
                departamento: null,
                estado: null,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                showOnMap: true,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('[LocationToggle] Server response:', data);
              setShowOnMap(data.showOnMap);
              setHasLocation(true);
              // Emit event to update map
              window.dispatchEvent(new Event('skater-location-updated'));
            } else {
              console.error('[LocationToggle] Error in response:', response.status);
            }
          } catch (error) {
            console.error('Error saving location:', error);
            alert('❌ ' + t('errorSavingLocation'));
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('❌ ' + t('couldNotGetLocation'));
          setLoading(false);
        }
      );
    } else {
      // Already has location, just change the toggle
      console.log('[LocationToggle] Has location, changing toggle...');
      setLoading(true);
      try {
        const newShowOnMapState = !showOnMap;
        console.log('[LocationToggle] New state:', newShowOnMapState);

        // Build request body: only send showOnMap, preserve existing coordinates
        const requestBody: any = {
          email: session.user.email,
          showOnMap: newShowOnMapState,
        };

        console.log('[LocationToggle] Sending request:', requestBody);

        const response = await fetch('/api/user/location', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[LocationToggle] ✅ Toggle successful:', data);
          setShowOnMap(newShowOnMapState);
          // Emit event to update map
          window.dispatchEvent(new Event('skater-location-updated'));
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[LocationToggle] ❌ Error in toggle:', response.status, errorData);
        }
      } catch (error) {
        console.error('Error updating location:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={showOnMap ? t('visibleOnMap') : t('appearOnMap')}
      className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 border-2 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600/80 hover:bg-green-500/90 border-green-300 hover:shadow-green-500/50"
    >
      <span className="text-lg md:text-xl transition-transform duration-300">
        {loading ? (
          <span className="animate-spin inline-block">⏳</span>
        ) : showOnMap ? (
          <span className="drop-shadow-lg">📍</span>
        ) : (
          <span className="opacity-70">📍</span>
        )}
      </span>

      {/* Indicador sutil cuando está activo */}
      {showOnMap && !loading && (
        <span className="absolute -top-0.5 -right-0.5 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
          ON
        </span>
      )}
    </button>
  );
}
