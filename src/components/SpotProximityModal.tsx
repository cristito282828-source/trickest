'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Camera, Video, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const THEME_COLORS = {
  brandPink: "#F35588",
  brandPinkDark: "#CC3377",
  inkInverse: "#ffffff",
};

interface NearbySpot {
  id: number;
  name: string;
  type: string;
  distance: number;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  stage: string;
  validationCount?: number;
}

interface SpotProximityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotRegistered?: () => void;
  onSpotValidated?: () => void;
}

// Inline component for the dynamic map
function DynamicMap({ components, center, onLocationConfirm }: {
  components: any;
  center: { lat: number; lng: number };
  onLocationConfirm: (location: { lat: number; lng: number }) => void;
}) {
  const [position, setPosition] = useState(center);

  const { MapContainer, TileLayer, Marker, useMapEvents, L } = components;

  function MapClickHandler() {
    useMapEvents({
      click(e: any) {
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        onLocationConfirm({ lat: e.latlng.lat, lng: e.latlng.lng });
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
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={18}
      style={{ height: '350px', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[position.lat, position.lng]} icon={customIcon}>
      </Marker>
      <MapClickHandler />
    </MapContainer>
  );
}

export default function SpotProximityModal({ isOpen, onClose, onSpotRegistered, onSpotValidated }: SpotProximityModalProps) {
  const t = useTranslations('spotProximityModal');
  const [mode, setMode] = useState<'loading' | 'confirming_location' | 'nearby' | 'new'>('loading');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmedLocation, setConfirmedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tempMapLocation, setTempMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SKATEPARK',
    description: ''
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [validatingSpotId, setValidatingSpotId] = useState<number | null>(null);
  const [validatedSpotIds, setValidatedSpotIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map states
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'loading') {
      detectLocationAndNearbySpots();
    }
  }, [isOpen]);

  const detectLocationAndNearbySpots = async () => {
    setError('');

    if (!navigator.geolocation) {
      setError(t('noGeolocation'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setTempMapLocation(location);

        // Go to location confirmation mode with map
        setMode('confirming_location');
        loadMapComponents();
      },
      (error) => {
        setError(t('errorGettingLocation'));
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadMapComponents = async () => {
    setMapLoading(true);
    try {
      // Import Leaflet CSS
      if (typeof window !== 'undefined') {
        require('leaflet/dist/leaflet.css');
      }

      const [leaflet, reactLeaflet] = await Promise.all([
        import('leaflet'),
        import('react-leaflet')
      ]);

      const { MapContainer: MC, TileLayer: TL, Marker: M, useMapEvents: UME } = reactLeaflet;

      setMapComponents({
        MapContainer: MC,
        TileLayer: TL,
        Marker: M,
        useMapEvents: UME,
        L: leaflet
      });
    } catch (err) {
      console.error('Error loading map:', err);
      setError('Error loading the map');
    } finally {
      setMapLoading(false);
    }
  };

  const handleLocationConfirmed = (lat: number, lng: number) => {
    setConfirmedLocation({ lat, lng });

    // Search for nearby spots with the confirmed location
    checkNearbySpots(lat, lng);
  };

  const checkNearbySpots = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `/api/spots/nearby?lat=${lat}&lng=${lng}&radius=0.5`
      );
      const data = await response.json();

      if (data.spots && data.spots.length > 0) {
        setNearbySpots(data.spots);
        setMode('nearby');
      } else {
        setMode('new');
      }
    } catch (err) {
      console.error('Error searching for nearby spots:', err);
      setMode('new');
    }
  };

  const handleValidateSpot = async (spotId: number) => {
    if (!confirmedLocation) return;

    setValidatingSpotId(spotId);
    setError('');

    try {
      const response = await fetch(`/api/spots/${spotId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GPS_PROXIMITY',
          latitude: confirmedLocation.lat,
          longitude: confirmedLocation.lng
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error validating');
      }

      // Mark as validated
      setValidatedSpotIds(prev => new Set(prev).add(spotId));

      // Show heart animation
      setShowHeartAnimation(true);

      // Show success message with validation count
      const validationCount = data.validationCount || 1;
      setSuccessMessage(`Validation confirmed!\n\n${validationCount} ${validationCount === 1 ? 'person has' : 'people have'} validated this spot\n+2 reputation pts`);

      onSpotValidated?.();

      // Hide animation after 1.5 seconds
      setTimeout(() => {
        setShowHeartAnimation(false);
      }, 1500);

      // Close after 2.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setValidatingSpotId(null);
    }
  };

  const handleRegisterNew = async (e: React.FormEvent, forceProceed: boolean = false) => {
    e.preventDefault();
    if (!confirmedLocation) return;

    setLoading(true);
    setError('');

    // Debug: log before sending
    console.log('📸 Sending registration with photo:', {
      photoUrl: photo,
      photoPreview: photoPreview ? 'exists' : 'does not exist',
      uploadingPhoto,
      photosArray: photo ? [photo] : []
    });

    try {
      const requestBody = {
        ...formData,
        latitude: confirmedLocation.lat,
        longitude: confirmedLocation.lng,
        photos: photo ? [photo] : [],
        forceProceed
      };

      console.log('📦 Request body completo:', requestBody);

      const response = await fetch('/api/spots/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        // If there are nearby spots, show options
        if (data.code === 'NEARBY_SPOTS_FOUND' && data.canProceed && !forceProceed) {
          const nearbyList = data.nearbySpots.map((s: any) =>
            `• ${s.name} (${s.type.toLowerCase()}) - ${Math.round(s.distance)}m`
          ).join('\n');

          const proceed = confirm(
            `${data.message}\n\nNearby spots:\n${nearbyList}\n\nContinue with registration anyway?`
          );

          if (proceed) {
            return handleRegisterNew(e, true);
          }
          setLoading(false);
          return;
        }

        // If there are too many spots, block
        if (data.code === 'TOO_MANY_NEARBY') {
          const nearbyList = data.nearbySpots.map((s: any) =>
            `• ${s.name} (${s.type.toLowerCase()}) - ${Math.round(s.distance)}m`
          ).join('\n');

          setError(
            `${data.message}\n\nNearby spots:\n${nearbyList}\n\n${data.suggest}`
          );
          setLoading(false);
          return;
        }

        throw new Error(data.message || 'Error registering');
      }

      // Extract the spot from the response (successResponse wrapper)
      const spotData = data.data?.spot || data.spot;
      const message = data.data?.message || data.message;

      // Show friendly success message
      setSuccessMessage(`✅ ${message}\n\nScore: ${spotData.confidenceScore}\nStage: ${spotData.stage}`);

      onSpotRegistered?.();

      // Close after 2.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File, isLive: boolean = false) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert(t('onlyImagesOrVideos'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(t('maxFileSize'));
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase in the background
    setUploadingPhoto(true);
    const uploadReader = new FileReader();
    uploadReader.onload = async () => {
      const base64 = uploadReader.result as string;

      try {
        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            filename: isLive ? `LIVE_${file.name}` : file.name,
            fileType: 'spot-photo'
          })
        });

        const data = await response.json();
        console.log('Upload response:', data);

        if (response.ok) {
          setPhoto(data.url);
          console.log(`✅ ${isLive ? 'Live' : ''} Photo uploaded successfully:`, data.url);
        } else {
          console.error('Upload failed:', data);
          setPhoto(null);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setPhoto(null);
      } finally {
        setUploadingPhoto(false);
        setShowCameraOptions(false);
      }
    };
    uploadReader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file, false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Create temporary input element with capture attribute
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use the back camera
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handlePhotoUpload(file, true); // true = live photo
        }
      };
      input.click();
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert(t('errorCamera'));
    }
  };

  const handleClose = () => {
    setMode('loading');
    setUserLocation(null);
    setConfirmedLocation(null);
    setTempMapLocation(null);
    setNearbySpots([]);
    setFormData({ name: '', type: 'SKATEPARK', description: '' });
    setPhoto(null);
    setPhotoPreview(null);
    setError('');
    setShowCameraOptions(false);
    setSuccessMessage('');
    setShowHeartAnimation(false);
    setValidatingSpotId(null);
    setValidatedSpotIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl shadow-2xl shadow-accent-cyan-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-neutral-800 px-6 py-4 border-b-4 border-accent-cyan-400">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase text-accent-cyan-400">
              {mode === 'loading' ? t('detecting') : mode === 'confirming_location' ? t('confirmLocation') : mode === 'nearby' ? t('nearbySpots') : t('newSpot')}
            </h2>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-accent-cyan-400 hover:bg-neutral-700 rounded-lg p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Success Overlay with Heart Animation */}
        {successMessage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/95 backdrop-blur-sm">
            <div className="text-center p-8">
              {/* Heart Animation */}
              {showHeartAnimation && (
                <div className="mb-6 relative">
                  <div className="text-8xl animate-bounce">
                    ❤️
                  </div>
                  {/* Floating hearts effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-4xl animate-ping" style={{ animationDelay: '0ms' }}>
                      💖
                    </span>
                    <span className="text-3xl animate-ping absolute" style={{ animationDelay: '200ms', left: '20%' }}>
                      💜
                    </span>
                    <span className="text-3xl animate-ping absolute" style={{ animationDelay: '400ms', right: '20%' }}>
                      💙
                    </span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              <div className="bg-gradient-to-r from-green-600 to-accent-cyan-600 border-4 border-white rounded-xl p-6 shadow-2xl">
                <p className="text-white font-black text-xl whitespace-pre-line">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Loading */}
          {mode === 'loading' && (
            <div className="text-center py-8">
              <div className="animate-pulse mb-4">
                <MapPin className="w-16 h-16 text-accent-cyan-400 mx-auto" />
              </div>
              <p className="text-accent-cyan-300 font-bold text-lg">{t('gettingLocation')}</p>
              <p className="text-neutral-400 text-sm mt-2">{t('takeFewSeconds')}</p>
            </div>
          )}

          {/* Confirming Location with Map */}
          {mode === 'confirming_location' && tempMapLocation && (
            <div className="space-y-4">
              <p className="text-accent-cyan-300 font-bold text-center">
                {t('confirmExactLocation')}
              </p>
              <p className="text-neutral-400 text-sm text-center">
                {t('clickToAdjust')}
              </p>

              {/* Map Container */}
              <div className="relative">
                {mapLoading || !mapComponents ? (
                  <div className="w-full h-[350px] rounded-lg bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin w-10 h-10 border-3 border-accent-cyan-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-accent-cyan-300 font-bold text-sm">{t('loadingMap')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border-2 border-accent-cyan-500">
                    <DynamicMap
                      components={mapComponents}
                      center={tempMapLocation}
                      onLocationConfirm={setTempMapLocation}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleClose}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg border-2 border-neutral-500 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => tempMapLocation && handleLocationConfirmed(tempMapLocation.lat, tempMapLocation.lng)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg border-2 border-green-400 transition-colors"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          )}

          {/* Nearby Spots */}
          {mode === 'nearby' && (
            <div>
              <div className="bg-accent-cyan-900/30 border-2 border-accent-cyan-500 rounded-lg p-4 mb-4">
                <p className="text-accent-cyan-300 font-bold">
                  {t('foundNearby', { count: nearbySpots.length })}
                </p>
                <p className="text-neutral-400 text-sm mt-1">
                  {t('validateToAddPoints')}
                </p>
              </div>

              <div className="space-y-3">
                {nearbySpots.map((spot) => (
                  <div
                    key={spot.id}
                    className="bg-neutral-900 border-2 border-accent-purple-500 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-black text-lg">{spot.name}</h3>
                        <p className="text-accent-purple-400 text-sm capitalize">{spot.type.toLowerCase()}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {/* Distance */}
                        <div className="bg-green-600 px-3 py-1 rounded-full border-2 border-green-400">
                          <span className="text-white font-black text-sm">
                            {Math.round(spot.distance)}m
                          </span>
                        </div>
                        {/* Validations */}
                        {spot.validationCount !== undefined && spot.validationCount > 0 && (
                          <div className="bg-accent-cyan-600 px-2 py-0.5 rounded-full border-2 border-accent-cyan-400">
                            <span className="text-white font-black text-xs">
                              ✓ {spot.validationCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleValidateSpot(spot.id)}
                      disabled={validatingSpotId !== null || validatedSpotIds.has(spot.id)}
                      className={`w-full font-bold py-2 px-4 rounded-lg border-2 transition-colors ${
                        validatingSpotId === spot.id
                          ? 'bg-accent-yellow-600 border-accent-yellow-400 text-white animate-pulse'
                          : validatedSpotIds.has(spot.id)
                          ? 'bg-accent-cyan-600 border-accent-cyan-400 text-white cursor-default'
                          : 'bg-green-600 hover:bg-green-500 border-green-400 text-white hover:disabled:bg-neutral-600 hover:disabled:cursor-not-allowed'
                      }`}
                    >
                      {validatingSpotId === spot.id
                        ? t('validating')
                        : validatedSpotIds.has(spot.id)
                        ? t('validated')
                        : t('validate')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-700">
                <p className="text-neutral-400 text-sm mb-2">{t('noneCorrect')}</p>
                <button
                  onClick={() => setMode('new')}
                  className="w-full bg-accent-purple-600 hover:bg-accent-purple-500 text-white font-bold py-2 px-4 rounded-lg border-2 border-accent-purple-400 transition-colors"
                >
                  {t('registerNewSpot')}
                </button>
              </div>
            </div>
          )}

          {/* New Spot */}
          {mode === 'new' && userLocation && (
            <form onSubmit={handleRegisterNew} className="space-y-4">
              {/* Location confirmed */}
              <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-3">
                <p className="text-green-300 font-bold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('locationDetected')}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
                  {t('spotNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
                  placeholder={t('spotNamePlaceholder')}
                  autoFocus
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
                  {t('typeLabel')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
                >
                  <option value="SKATEPARK">{`🛹 ${t('skatepark')}`}</option>
                  <option value="SKATESHOP">{`🏪 ${t('skateshop')}`}</option>
                  <option value="SPOT">{`🎯 ${t('streetSpot')}`}</option>
                </select>
              </div>

              {/* Photo/Video */}
              <div>
                <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
                  {t('photoOptional')}
                </label>
                <div className="space-y-2">
                  {!photoPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowCameraOptions(!showCameraOptions)}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-900 border-2 border-dashed border-accent-purple-500 hover:border-accent-purple-400 rounded-lg p-4 cursor-pointer transition-colors"
                      >
                        <Camera className="w-5 h-5 text-accent-purple-400" />
                        <span className="text-accent-purple-300 font-bold text-sm">
                          {t('addPhoto')}
                        </span>
                      </button>

                      {showCameraOptions && (
                        <div className="grid grid-cols-2 gap-2">
                          {/* Take photo now */}
                          <button
                            type="button"
                            onClick={handleCameraCapture}
                            className="flex flex-col items-center gap-2 bg-accent-cyan-600 hover:bg-accent-cyan-500 text-white p-3 rounded-lg border-2 border-accent-cyan-400 transition-colors"
                          >
                            <Camera className="w-6 h-6" />
                            <span className="font-bold text-xs text-center">
                              {t('takePhoto')}<br/>
                              <span className="text-accent-cyan-200">+10 pts</span>
                            </span>
                          </button>

                          {/* Upload existing */}
                          <label className="flex flex-col items-center gap-2 bg-accent-purple-600 hover:bg-accent-purple-500 text-white p-3 rounded-lg border-2 border-accent-purple-400 cursor-pointer transition-colors">
                            <Video className="w-6 h-6" />
                            <span className="font-bold text-xs text-center">
                              {t('upload')}<br/>
                              <span className="text-accent-purple-200">+5 pts</span>
                            </span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      {/* Image preview */}
                      <div className="relative bg-neutral-900 border-2 border-green-500 rounded-lg overflow-hidden">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white font-bold">{`⏳ ${t('uploading')}`}</div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Take new photo */}
                        <button
                          type="button"
                          onClick={handleCameraCapture}
                          className="flex items-center justify-center gap-2 bg-accent-cyan-600 hover:bg-accent-cyan-500 text-white p-2 rounded-lg border-2 border-accent-cyan-400 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="font-bold text-sm">{t('newPhoto')}</span>
                        </button>

                        {/* Change file */}
                        <label className="flex items-center justify-center gap-2 bg-accent-purple-600 hover:bg-accent-purple-500 text-white p-2 rounded-lg border-2 border-accent-purple-400 cursor-pointer transition-colors">
                          <Video className="w-4 h-4" />
                          <span className="font-bold text-sm">{t('upload')}</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {uploadingPhoto && !photo && (
                        <p className="text-accent-yellow-400 text-xs font-bold text-center animate-pulse">
                          {t('uploadingToServer')}
                        </p>
                      )}
                      {photo && (
                        <p className="text-green-400 text-xs font-bold text-center">
                          {t('photoReady')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
                  {t('descriptionOptional')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
                  rows={2}
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-3">
                  <p className="text-red-300 font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formData.name || uploadingPhoto}
                className="w-full bg-accent-cyan-600 hover:bg-accent-cyan-500 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-lg px-6 py-3 rounded-xl border-4 border-white shadow-2xl transition-all transform hover:scale-105 disabled:transform-none"
              >
                {loading ? t('registering') : uploadingPhoto ? t('uploadingPhoto') : t('registerSpot')}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => setMode('nearby')}
                className="w-full text-neutral-400 hover:text-white font-bold underline"
              >
                {t('backToNearby')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
