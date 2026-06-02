'use client';

import { useState } from 'react';
import { MapPin, Camera, X } from 'lucide-react';
import PhotoUploader from './PhotoUploader';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

function SpotLocationPickerLoading() {
  const t = useTranslations('spotRegistrationForm');
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
      <div className="bg-neutral-800 border-4 border-accent-cyan-400 rounded-xl p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-accent-cyan-300 font-bold">{t('loadingMap')}</p>
      </div>
    </div>
  );
}

const SpotLocationPicker = dynamic(() => import('./SpotLocationPicker'), {
  ssr: false,
  loading: () => <SpotLocationPickerLoading />
});

interface SpotRegistrationFormProps {
  onSuccess?: (spot: {
    id: number;
    name: string;
    type: string;
    confidenceScore: number;
    stage: string;
  }) => void;
}

export default function SpotRegistrationForm({ onSuccess }: SpotRegistrationFormProps) {
  const t = useTranslations('spotRegistrationForm');
  const [formData, setFormData] = useState({
    name: '',
    type: 'SKATEPARK' as 'SKATEPARK' | 'SKATESHOP' | 'SPOT',
    latitude: 0,
    longitude: 0,
    description: '',
    address: '',
    city: '',
    features: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending data to backend:', { ...formData, photos: uploadedPhotos });

      const response = await fetch('/api/spots/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photos: uploadedPhotos
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('errorRegistering'));
      }

      alert(`✅ ${data.message}\n\n${t('successAlert', { score: data.spot.confidenceScore, stage: data.spot.stage })}`);

      // Reset form
      setFormData({
        name: '',
        type: 'SKATEPARK',
        latitude: 0,
        longitude: 0,
        description: '',
        address: '',
        city: '',
        features: []
      });
      setUploadedPhotos([]);

      onSuccess?.(data.spot);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('noGeolocation'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Set coordinates and open map
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        // Open map modal so user can confirm/adjust
        setShowLocationPicker(true);
      },
      (error) => {
        alert(`${t('errorGettingLocation')}: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleOpenMap = () => {
    if (!formData.latitude || !formData.longitude) {
      alert(t('getGpsFirst'));
      return;
    }
    setShowLocationPicker(true);
  };

  const handleLocationConfirm = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
    setShowLocationPicker(false);
  };

  const handlePhotoUpload = (url: string) => {
    console.log('Photo uploaded:', url);
    setUploadedPhotos([...uploadedPhotos, url]);
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-neutral-800 border-4 border-accent-purple-400 rounded-xl p-6 shadow-2xl shadow-accent-purple-500/30">
      <h2 className="text-3xl font-black uppercase text-accent-purple-300 mb-6">
        {`➕ ${t('title')}`}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`📍 ${t('spotName')}`}
          </label>
          <input
            type="text"
            required
            minLength={3}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
            placeholder={t('spotNamePlaceholder')}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`🎯 ${t('type')}`}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
          >
            <option value="SKATEPARK">{`🛹 ${t('skatepark')}`}</option>
            <option value="SKATESHOP">{`🏪 ${t('skateshop')}`}</option>
            <option value="SPOT">{`🎯 ${t('streetSpot')}`}</option>
          </select>
        </div>

        {/* Location */}
        <div className="bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg p-4">
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`📍 ${t('gpsLocation')}`}
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={handleGetLocation}
              className="bg-accent-cyan-600 hover:bg-accent-cyan-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {t('useMyLocation')}
            </button>
            <button
              type="button"
              onClick={handleOpenMap}
              disabled={!formData.latitude || !formData.longitude}
              className="bg-accent-purple-600 hover:bg-accent-purple-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              {`🗺️ ${t('adjustOnMap')}`}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              required
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 bg-neutral-800 border border-accent-cyan-600 rounded text-white text-sm"
              placeholder={t('latitude')}
            />
            <input
              type="number"
              step="any"
              required
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 bg-neutral-800 border border-accent-cyan-600 rounded text-white text-sm"
              placeholder={t('longitude')}
            />
          </div>
          {formData.latitude && formData.longitude && (
            <p className="text-accent-cyan-100 text-xs mt-2">
              {`✅ ${t('locationSet')}:`} {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`📝 ${t('description')}`}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
            rows={3}
            placeholder={t('descriptionPlaceholder')}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`🏠 ${t('address')}`}
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
            placeholder={t('addressPlaceholder')}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`🏙️ ${t('city')}`}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-3 bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-300"
            placeholder={t('cityPlaceholder')}
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-accent-cyan-300 font-black uppercase text-sm mb-2">
            {`📸 ${t('spotPhotos')}`}
          </label>
          <PhotoUploader
            onUploadComplete={handlePhotoUpload}
            currentPhotos={uploadedPhotos}
            maxPhotos={5}
          />

          {/* Preview of uploaded photos */}
          {uploadedPhotos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-accent-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-accent-cyan-100 text-xs mt-2">
            {t('photosAdded', { count: uploadedPhotos.length })}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4">
            <p className="text-red-300 font-bold">❌ {error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-purple-600 hover:bg-accent-purple-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-lg px-8 py-4 rounded-xl border-4 border-white shadow-2xl shadow-accent-purple-500/50 transition-all transform hover:scale-105"
        >
          {loading ? `⏳ ${t('registering')}` : `🚀 ${t('registerSpot')}`}
        </button>

        {/* Info */}
        <div className="bg-neutral-900/50 border border-neutral-600 rounded p-3">
          <p className="text-accent-cyan-100 text-xs">
            <strong>ℹ️ Info:</strong> The spot will start in <span className="text-accent-yellow-400">GHOST</span> stage (only visible to you).
            It needs validations from other users to advance to <span className="text-accent-cyan-400">REVIEW</span>,
            <span className="text-green-400">VERIFIED</span> and <span className="text-accent-purple-400">LEGENDARY</span>.
          </p>
        </div>
      </form>

      {/* Location selection map modal */}
      {showLocationPicker && (
        <SpotLocationPicker
          initialLat={formData.latitude}
          initialLng={formData.longitude}
          onConfirm={handleLocationConfirm}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
