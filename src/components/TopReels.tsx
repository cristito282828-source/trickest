'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getYouTubeThumbnail, getEmbedUrl, extractVideoId } from '@/lib/youtube';
import { MdPlayCircle, MdStar, MdChevronRight } from 'react-icons/md';

interface Reel {
  id: number;
  videoUrl: string;
  score: number | null;
  submittedAt: string;
  upvotes: number;
  voteCount: number;
  challenge: {
    name: string;
    level: number;
    difficulty: string;
    points: number;
    isBonus: boolean;
  };
  user: {
    email: string;
    name: string | null;
    photo: string | null;
    username: string | null;
  };
}

export default function TopReels() {
  const t = useTranslations('topReels');
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await fetch('/api/reels');
        if (res.ok) {
          const data = await res.json();
          setReels(data.data?.reels ?? []);
        }
      } catch (err) {
        console.error('Error fetching reels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  if (loading) {
    return (
      <div className="pt-20 pb-12 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-400" />
      </div>
    );
  }

  if (reels.length === 0) return null;

  return (
    <section className="pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header (mismo patrón que HomeRanking) */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <div className="bg-neutral-800 border-4 border-cyan-500 rounded-lg px-6 py-4 shadow-lg shadow-cyan-500/20">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider">
                {t('title')}
              </h2>
              <p className="text-cyan-400 mt-2 text-xs md:text-sm uppercase tracking-wider">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de reels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel) => {
            const videoId = extractVideoId(reel.videoUrl);
            const thumbnail = videoId ? getYouTubeThumbnail(reel.videoUrl) : null;

            return (
              <button
                key={reel.id}
                type="button"
                onClick={() => setActiveReel(reel)}
                className="group relative block bg-neutral-900 border-2 border-neutral-700 rounded-xl overflow-hidden hover:border-cyan-400 hover:scale-[1.02] transition-all text-left"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-neutral-800">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={reel.challenge.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                      No preview
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <MdPlayCircle
                      className="text-white/90 group-hover:text-cyan-400 text-5xl drop-shadow-lg transition-colors"
                      size={64}
                    />
                  </div>

                  {/* Score badge top-right */}
                  {reel.score !== null && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                      <MdStar className="text-accent-yellow-400" size={14} />
                      <span className="text-white font-black text-xs">{reel.score}</span>
                    </div>
                  )}

                  {/* Difficulty bottom-left */}
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="text-cyan-400 font-black text-[10px] uppercase tracking-wider">
                      L{reel.challenge.level} · {reel.challenge.difficulty}
                    </span>
                  </div>
                </div>

                {/* Footer con autor */}
                <div className="p-3 flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {reel.user.photo ? (
                      <Image
                        src={reel.user.photo}
                        alt={reel.user.name || 'Skater'}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full border-2 border-cyan-400 object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-2 border-cyan-400">
                        <span className="text-white font-black text-xs">
                          {(reel.user.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">
                      {reel.user.name || 'Skater'}
                    </p>
                    <p className="text-neutral-400 text-[10px] truncate">
                      {reel.challenge.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA "Ver todos" (futuro: link a /reels) */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard/leaderboard"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider text-sm"
          >
            {t('viewAll')}
            <MdChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Modal de video (lightbox) */}
      {activeReel && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={getEmbedUrl(activeReel.videoUrl, { autoplay: true, mute: false })}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setActiveReel(null)}
              className="absolute -top-12 right-0 text-white text-sm font-bold uppercase tracking-wider hover:text-cyan-400"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
