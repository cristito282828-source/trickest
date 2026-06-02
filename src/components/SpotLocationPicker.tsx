'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

const THEME_COLORS = {
  brandPink: "#F35588",
  brandPinkDark: "#CC3377",
  inkInverse: "#ffffff",
};

interface SpotLocationPickerProps {
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

interface LeafletComponents {
  MapContainer: any;
  TileLayer: any;
  Marker: any;
  useMapEvents: any;
  L: any;
}

export default function SpotLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel
}: SpotLocationPickerProps) {
  const t = useTranslations('spotLocationPicker');
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [components, setComponents] = useState<LeafletComponents | null>(null);

  useEffect(() => {
    // Import Leaflet CSS
    if (typeof window !== 'undefined') {
      require('leaflet/dist/leaflet.css');
    }

    // Load Leaflet and React-Leaflet dynamically
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([leaflet, reactLeaflet]) => {
      const { MapContainer: MC, TileLayer: TL, Marker: M, useMapEvents: UME } = reactLeaflet;
      setComponents({ MapContainer: MC, TileLayer: TL, Marker: M, useMapEvents: UME, L: leaflet });
    });
  }, []);

  if (!components) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
        <div className="bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-accent-cyan-300 font-bold">{t('loadingMap')}</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, L } = components;

  function MapClickHandler() {
    useMapEvents({
      click(e: any) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      },
    });
    return null;
  }

  const customIcon = L.divIcon({
    className: 'custom-spot-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, ${THEME_COLORS.brandPink}, ${THEME_COLORS.brandPinkDark});
          border-radius: 50%;
          border: 3px solid ${THEME_COLORS.inkInverse};
          box-shadow: 0 0 20px rgba(243, 85, 136, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          animation: pulse 2s infinite;
        ">📍</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-cyan-600 to-accent-purple-600 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white uppercase flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {t('title')}
            </h3>
            <p className="text-accent-cyan-100 text-sm mt-1">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          <MapContainer
            center={[lat, lng]}
            zoom={18}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon}>
            </Marker>
            <MapClickHandler />
          </MapContainer>
        </div>

        {/* Coordinates and actions */}
        <div className="p-4 bg-neutral-900 border-t-2 border-accent-cyan-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-neutral-800 border border-accent-cyan-500 rounded-lg p-3">
              <label className="block text-accent-cyan-400 text-xs font-bold uppercase mb-1">
                {t('latitude')}
              </label>
              <p className="text-white font-mono text-lg">{lat.toFixed(6)}</p>
            </div>
            <div className="bg-neutral-800 border border-accent-cyan-500 rounded-lg p-3">
              <label className="block text-accent-cyan-400 text-xs font-bold uppercase mb-1">
                {t('longitude')}
              </label>
              <p className="text-white font-mono text-lg">{lng.toFixed(6)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg border-2 border-neutral-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <Button
              onClick={() => onConfirm(lat, lng)}
              variant="purple"
              size="lg"
              arcadeBorder={false}
              leftIcon={<Check className="w-5 h-5" />}
              className="flex-1"
            >
              {t('confirmLocation')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
