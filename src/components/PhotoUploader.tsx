'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploaderProps {
  onUploadComplete: (url: string) => void;
  maxPhotos?: number;
  currentPhotos?: string[];
  spotId?: number;
}

export default function PhotoUploader({
  onUploadComplete,
  maxPhotos = 10,
  currentPhotos = [],
  spotId
}: PhotoUploaderProps) {
  const t = useTranslations('photoUploader');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('onlyImages'));
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('maxSize'));
      return;
    }

    // Validate photo limit
    if (currentPhotos.length >= maxPhotos) {
      alert(t('maxPhotos', { max: maxPhotos }));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      setUploading(true);

      try {
        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            fileType: 'spot-photo'
          })
        });

        if (response.ok) {
          const data = await response.json();
          onUploadComplete(data.url);
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert(t('errorUploading'));
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black uppercase">{`📸 ${t('title')}`}</h3>
        <span className="text-accent-cyan-400 text-sm">
          {currentPhotos.length}/{maxPhotos}
        </span>
      </div>

      {/* Upload Button */}
      <div className="flex gap-2">
        <button
          onClick={handleCameraClick}
          disabled={uploading || currentPhotos.length >= maxPhotos}
          className="flex-1 bg-accent-cyan-600 hover:bg-accent-cyan-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded border-2 border-accent-cyan-300 transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('uploading')}
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              {currentPhotos.length > 0 ? t('addAnother') : t('uploadPhoto')}
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || currentPhotos.length >= maxPhotos}
        />
      </div>

      {/* Photo preview */}
      {currentPhotos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {currentPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border-2 border-accent-cyan-400"
              />
              <button
                onClick={() => {/* TODO: Implementar delete */}}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-neutral-800/50 border border-neutral-600 rounded p-3">
        <p className="text-accent-cyan-100 text-xs">
          <strong>Tip:</strong> {t('tip')} {t('maxPhotosHint', { max: maxPhotos })}
        </p>
      </div>
    </div>
  );
}
