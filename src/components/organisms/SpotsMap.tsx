'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet/dist/react-leaflet.css';

const THEME_COLORS = {
  brandCyan: "#00D9FF",
  brandPink: "#F35588",
};

// Fix para los iconos de Leaflet en Next.js
const iconSkatepark = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${THEME_COLORS.brandCyan}" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconSkateshop = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${THEME_COLORS.brandPink}" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
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

interface SpotsMapProps {
  spots: Spot[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onSpotClick?: (spot: Spot) => void;
}

// Componente para centrar el mapa cuando cambian los spots
function MapController({ spots }: { spots: Spot[] }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length > 0) {
      const bounds = L.latLngBounds(
        spots.map(spot => [spot.latitude, spot.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots, map]);

  return null;
}

export default function SpotsMap({
  spots,
  center = [4.711, -74.0721], // Bogotá por defecto
  zoom = 13,
  height = '600px',
  onSpotClick,
}: SpotsMapProps) {
  const [mounted, setMounted] = useState(false);

  // Montar componente solo en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-full rounded-xl border-4 border-accent-cyan-400 bg-neutral-900 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-accent-cyan-400 font-black text-xl">
          🗺️ CARGANDO MAPA...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border-4 border-accent-cyan-400 overflow-hidden shadow-2xl shadow-accent-cyan-500/50" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spots.length > 0 && <MapController spots={spots} />}

        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={spot.type === 'skatepark' ? iconSkatepark : iconSkateshop}
            eventHandlers={{
              click: () => {
                if (onSpotClick) {
                  onSpotClick(spot);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-black text-lg uppercase text-neutral-900">
                    {spot.name}
                  </h3>
                  {spot.isVerified && (
                    <span className="text-green-500 text-xl ml-2" title="Verificado">
                      ✓
                    </span>
                  )}
                </div>

                {/* Tipo */}
                <div className="mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    spot.type === 'skatepark'
                      ? 'bg-accent-cyan-100 text-accent-cyan-700'
                      : 'bg-accent-pink-100 text-accent-pink-700'
                  }`}>
                    {spot.type === 'skatepark' ? '🛹 Skatepark' : '🏪 Skateshop'}
                  </span>
                </div>

                {/* Rating */}
                {spot.rating !== undefined && spot.rating > 0 && (
                  <div className="mb-2">
                    <span className="text-accent-yellow-500">
                      {'⭐'.repeat(Math.round(spot.rating))}
                    </span>
                    <span className="text-neutral-600 text-sm ml-1">
                      {spot.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Descripción */}
                {spot.description && (
                  <p className="text-sm text-neutral-700 mb-2">
                    {spot.description}
                  </p>
                )}

                {/* Dirección */}
                {spot.address && (
                  <p className="text-xs text-neutral-600 mb-1">
                    📍 {spot.address}
                  </p>
                )}

                {/* Ciudad */}
                {spot.city && (
                  <p className="text-xs text-neutral-600 mb-2">
                    🏙️ {spot.city}
                  </p>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {spot.instagram && (
                    <a
                      href={`https://instagram.com/${spot.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-accent-purple-600 text-white px-2 py-1 rounded font-bold hover:bg-accent-purple-700"
                    >
                      📸 Instagram
                    </a>
                  )}
                  {spot.phone && (
                    <a
                      href={`tel:${spot.phone}`}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded font-bold hover:bg-green-700"
                    >
                      📞 Llamar
                    </a>
                  )}
                  {spot.website && (
                    <a
                      href={spot.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-accent-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-accent-blue-700"
                    >
                      🌐 Web
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
