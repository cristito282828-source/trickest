'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, Star } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import SpotComments from './SpotComments';
import { useTranslations } from 'next-intl';

interface SpotModalProps {
  isOpen: boolean;
  spotId: number | null;
  commentId?: number | null;
  onClose: () => void;
}

interface Spot {
  id: number;
  name: string;
  type: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  confidenceScore: number;
}

export default function SpotModal({ isOpen, spotId, commentId, onClose }: SpotModalProps) {
  const t = useTranslations('spotModal');
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);

  // Close with ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Load spot data
  useEffect(() => {
    if (!isOpen || !spotId) return;

    const fetchSpot = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/spots/${spotId}`);
        if (response.ok) {
          const data = await response.json();
          setSpot(data.data || data);
        }
      } catch (error) {
        console.error('Error loading spot:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpot();
  }, [isOpen, spotId]);


  // Prevent body scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !spotId) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex items-center justify-center min-h-screen p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white">
              <h2 className="text-lg font-bold text-neutral-900">
                {spot?.name || t('spotFallback', { id: spotId })}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label={t('close')}
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Spot Info */}
              <div className="p-6 border-b border-neutral-200">
                {loading ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-neutral-200 rounded-lg animate-pulse"></div>
                    <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : spot ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-green-500 to-accent-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-6xl">🛹</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{spot.name}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {[spot.city, spot.state, spot.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      {spot.description && (
                        <p className="mt-3 text-neutral-700">{spot.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Star className="w-4 h-4 text-accent-yellow-500 fill-accent-yellow-500" />
                        <span className="text-sm font-medium">
                          {t('confidence', { score: spot.confidenceScore })}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {spot.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500">{t('spotNotFound')}</p>
                )}
              </div>

              {/* Comments */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">{t('commentsTitle')}</h3>
                </div>
                <SpotComments spotId={spotId} maxHeight="none" highlightCommentId={commentId} />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 bg-white">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <input
                  type="text"
                  placeholder={t('writeComment')}
                  className="w-full outline-none text-neutral-900 placeholder-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
