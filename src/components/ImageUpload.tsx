'use client';

import { useTranslations } from 'next-intl';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
}

export default function ImageUpload({
  currentImage,
  onImageChange,
}: ImageUploadProps) {
  const t = useTranslations('imageUpload');
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('onlyImagesAllowed'));
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('maxSize'));
      return;
    }

    setUploading(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error uploading image');

      const data = await response.json();
      const imageUrl = data.url;

      setPreview(imageUrl);
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('errorUploading'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Image preview */}
      <div className="relative group">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-accent-cyan-500 shadow-lg shadow-accent-cyan-500/50 overflow-hidden bg-neutral-800 flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Profile"
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-12 h-12 text-neutral-600" />
          )}
        </div>

        {/* Delete button (only if there's an image) */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 border-2 border-white shadow-lg transform hover:scale-110 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent-cyan-400"></div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="profile-image-upload"
        />
        <label
          htmlFor="profile-image-upload"
          className={`cursor-pointer bg-gradient-to-r from-accent-cyan-500 to-accent-blue-500 hover:from-accent-cyan-400 hover:to-accent-blue-400 text-white font-bold py-2 px-6 rounded-lg border-2 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? t('uploading') : t('changePhoto')}
        </label>
        <p className="text-xs text-neutral-400 text-center">
          {t('fileHint')}
        </p>
      </div>
    </div>
  );
}
