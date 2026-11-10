'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const locationUpdateIntervalMs = 30_000;

export default function LocationToggle() {
  const { data: session } = useSession();
  const t = useTranslations('locationToggle');
  const [loading, setLoading] = useState(false);
  const [showOnMap, setShowOnMap] = useState(false);
  const lastLocationUpdateAt = useRef(0);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;

    const fetchLocationStatus = async () => {
      try {
        const searchParams = new URLSearchParams({ email });
        const response = await fetch(`/api/user/location?${searchParams.toString()}`, { cache: 'no-store' });
        const result: unknown = await response.json();
        if (!response.ok || !isLocationStatus(result)) {
          throw new Error(getResponseError(result) || t('errorSavingLocation'));
        }
        setShowOnMap(result.showOnMap);
      } catch (error) {
        console.error('Error loading location status:', error);
      }
    };

    void fetchLocationStatus();
  }, [session?.user?.email, t]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!showOnMap || !email || !navigator.geolocation) return;

    let active = true;
    let savingPosition = false;
    const savePosition = async (coords: GeolocationCoordinates) => {
      const now = Date.now();
      if (!active || savingPosition || now - lastLocationUpdateAt.current < locationUpdateIntervalMs) return;

      savingPosition = true;
      try {
        await saveLocation({
          email,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }, t('errorSavingLocation'));
        if (!active) return;
        lastLocationUpdateAt.current = Date.now();
        window.dispatchEvent(new Event('skater-location-updated'));
      } catch (error) {
        console.error('Error refreshing shared location:', error);
      } finally {
        savingPosition = false;
      }
    };
    const geolocationOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 20_000,
    };
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => void savePosition(coords),
      (error) => {
        console.error('Could not refresh shared location:', error);
      },
      geolocationOptions
    );
    const refreshInterval = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => void savePosition(coords),
        (error) => console.error('Could not refresh shared location:', error),
        geolocationOptions
      );
    }, locationUpdateIntervalMs);

    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(refreshInterval);
    };
  }, [session?.user?.email, showOnMap, t]);

  const handleToggle = async () => {
    const email = session?.user?.email;
    if (!email) {
      console.error('[LocationToggle] Cannot update location without an authenticated user.');
      return;
    }

    const newShowOnMapState = !showOnMap;
    if (newShowOnMapState) {
      if (!navigator.geolocation) {
        alert('❌ ' + t('noGeolocation'));
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const user = await saveLocation({
              email,
              showOnMap: true,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }, t('errorSavingLocation'));
            lastLocationUpdateAt.current = Date.now();
            setShowOnMap(user.showOnMap);
            window.dispatchEvent(new Event('skater-location-updated'));
          } catch (error) {
            console.error('Error saving location:', error);
            alert(`❌ ${error instanceof Error ? error.message : t('errorSavingLocation')}`);
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
      return;
    }

    setLoading(true);
    try {
      const user = await saveLocation({
        email,
        showOnMap: false,
      }, t('errorSavingLocation'));
      setShowOnMap(user.showOnMap);
      window.dispatchEvent(new Event('skater-location-updated'));
    } catch (error) {
      console.error('Error updating location visibility:', error);
      alert(`❌ ${error instanceof Error ? error.message : t('errorSavingLocation')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={showOnMap ? t('visibleOnMap') : t('appearOnMap')}
      aria-pressed={showOnMap}
      className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-lime-400 font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 border-2 border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed bg-lime-500/20 hover:bg-lime-500/40 hover:border-lime-300 hover:shadow-lime-500/60"
    >
      <span className={`text-lg md:text-xl transition-all duration-300 ${showOnMap ? 'text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)] scale-110' : 'text-lime-400/40'}`}>
        {loading ? (
          <span className="animate-spin inline-block">⏳</span>
        ) : (
          <span>📍</span>
        )}
      </span>

      {showOnMap && !loading && (
        <span className="absolute -top-0.5 -right-0.5 bg-lime-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
          ON
        </span>
      )}
    </button>
  );
}

async function saveLocation(body: {
  email: string;
  showOnMap?: boolean;
  latitude?: number;
  longitude?: number;
}, fallbackError: string) {
  const response = await fetch('/api/user/location', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json();
  if (!response.ok || !isLocationUpdateResponse(result)) {
    throw new Error(getResponseError(result) || fallbackError);
  }
  return result.user;
}

function isLocationStatus(value: unknown): value is { showOnMap: boolean } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'showOnMap' in value &&
    typeof value.showOnMap === 'boolean'
  );
}

function isLocationUpdateResponse(value: unknown): value is {
  user: { showOnMap: boolean };
} {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'user' in value &&
    value.user &&
    typeof value.user === 'object' &&
    'showOnMap' in value.user &&
    typeof value.user.showOnMap === 'boolean'
  );
}

function getResponseError(value: unknown) {
  if (!value || typeof value !== 'object' || !('error' in value)) return '';
  return typeof value.error === 'string' ? value.error : '';
}
