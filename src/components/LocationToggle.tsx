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

    const newShowOnMapState = !showOnMap;
    console.log('[LocationToggle] Toggle clicked:', {
      hasLocation,
      showOnMap,
      newState: newShowOnMapState,
    });

    // Activando (OFF -> ON): siempre refrescar GPS para tomar la posición actual.
    // Desactivando (ON -> OFF): solo flippear el flag, conservar coordenadas en DB.
    if (newShowOnMapState) {
      console.log('[LocationToggle] Activating, requesting fresh GPS...');
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
      // Desactivando (ON -> OFF): solo flippear el flag, preservar coordenadas existentes.
      console.log('[LocationToggle] Deactivating, preserving coordinates...');
      setLoading(true);
      try {
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
      className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-lime-400 font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 border-2 border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed bg-lime-500/20 hover:bg-lime-500/40 hover:border-lime-300 hover:shadow-lime-500/60"
    >
      <span className={`text-lg md:text-xl transition-all duration-300 ${showOnMap ? 'text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)] scale-110' : 'text-lime-400/40'}`}>
        {loading ? (
          <span className="animate-spin inline-block">⏳</span>
        ) : (
          <span>📍</span>
        )}
      </span>

      {/* Indicador sutil cuando está activo */}
      {showOnMap && !loading && (
        <span className="absolute -top-0.5 -right-0.5 bg-lime-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
          ON
        </span>
      )}
    </button>
  );
}
