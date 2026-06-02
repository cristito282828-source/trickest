'use client';

import { ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface TeamLogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  teamName?: string;
}

export default function TeamLogoUpload({
  currentLogo,
  onLogoChange,
  teamName = 'Equipo',
}: TeamLogoUploadProps) {
  const t = useTranslations('teamLogoUpload');
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar preview con currentLogo cuando cambia
  useEffect(() => {
    setPreview(currentLogo || null);
  }, [currentLogo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert(t('onlyImagesAllowed'));
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('maxSize'));
      return;
    }

    setUploading(true);

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Subir a la API de team logo
      const response = await fetch('/api/upload/team-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir el logo');

      const data = await response.json();
      const logoUrl = data.url;

      setPreview(logoUrl);
      onLogoChange(logoUrl);
    } catch (error) {
      console.error('Error al subir logo:', error);
      alert(t('errorUploading'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview del logo */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-xl border-4 border-purple-500 shadow-lg shadow-purple-500/50 overflow-hidden bg-slate-800">
          {preview ? (
            <Image
              src={preview}
              alt={`${teamName} logo`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-white/50" />
            </div>
          )}
        </div>

        {/* Overlay con icono de cámara (siempre visible) */}
        {!uploading && (
          <label
            htmlFor="team-logo-upload"
            className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <Upload className="w-10 h-10 text-white" />
          </label>
        )}

        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-purple-400"></div>
          </div>
        )}
      </div>

      {/* Botón de upload */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="team-logo-upload"
        />
        <label
          htmlFor="team-logo-upload"
          className={`cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg border-2 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? t('uploading') : t('uploadLogo')}
        </label>
        <p className="text-xs text-slate-400 text-center">
          {t('fileHint')}
        </p>
      </div>
    </div>
  );
}
