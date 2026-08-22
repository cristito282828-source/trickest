'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getYouTubeThumbnail, getEmbedUrl, extractVideoId } from '@/lib/youtube';
import { MdPlayCircle, MdStar, MdChevronRight, MdFavorite, MdFavoriteBorder, MdChatBubbleOutline } from 'react-icons/md';
import ReelComments from '@/components/reel/ReelComments';

interface Reel {
  id: number;
  videoUrl: string;
  score: number | null;
  submittedAt: string;
  upvotes: number;
  voteCount: number;
  userVote: 'upvote' | null;
  commentCount: number;
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
  const { data: session } = useSession();
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

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

  const handleLike = async (reelId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    if (isLiking) return;
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    setIsLiking(true);

    // Optimistic update
    const wasLiked = reel.userVote === 'upvote';
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              upvotes: wasLiked ? r.upvotes - 1 : r.upvotes + 1,
              userVote: wasLiked ? null : 'upvote',
            }
          : r
      )
    );
    // También actualizar activeReel si está abierto
    if (activeReel?.id === reelId) {
      setActiveReel((prev) =>
        prev
          ? {
              ...prev,
              upvotes: wasLiked ? prev.upvotes - 1 : prev.upvotes + 1,
              userVote: wasLiked ? null : 'upvote',
            }
          : prev
      );
    }

    try {
      if (wasLiked) {
        await fetch(`/api/reels/${reelId}/like`, { method: 'DELETE' });
      } else {
        await fetch(`/api/reels/${reelId}/like`, { method: 'POST' });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId
            ? {
                ...r,
                upvotes: wasLiked ? r.upvotes + 1 : r.upvotes - 1,
                userVote: wasLiked ? 'upvote' : null,
              }
            : r
        )
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentCountChange = (newCount: number) => {
    setReels((prev) =>
      prev.map((r) => (r.id === activeReel?.id ? { ...r, commentCount: newCount } : r))
    );
  };

  if (loading) {
    return (
      <div className="pt-20 pb-12 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-400" />
      </div>
    );
  }

  if (reels.length === 0) return null;

  return (
    <section className="pt-4 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Grid de reels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel) => {
            const videoId = extractVideoId(reel.videoUrl);
            const thumbnail = videoId ? getYouTubeThumbnail(reel.videoUrl) : null;
            const isLiked = reel.userVote === 'upvote';

            return (
              <div
                key={reel.id}
                onClick={() => setActiveReel(reel)}
                className="group relative block bg-neutral-900 border-2 border-neutral-700 rounded-xl overflow-hidden hover:border-cyan-400 hover:scale-[1.02] transition-all cursor-pointer"
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

                {/* Footer con autor + acciones */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
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

                  {/* Like + Comments counts (clickeables) */}
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleLike(reel.id, e)}
                      disabled={isLiking}
                      className={`flex items-center gap-1 transition-colors ${
                        isLiked ? 'text-pink-500' : 'text-neutral-400 hover:text-pink-400'
                      }`}
                      title={session?.user ? (isLiked ? t('liked') : t('like')) : t('loginToLike')}
                    >
                      {isLiked ? (
                        <MdFavorite className="fill-pink-500" size={16} />
                      ) : (
                        <MdFavoriteBorder size={16} />
                      )}
                      <span className="font-bold">{reel.upvotes}</span>
                    </button>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <MdChatBubbleOutline size={16} />
                      <span className="font-bold">{reel.commentCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
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

      {/* Modal estilo Instagram Reels: video fullscreen + overlay lateral con acciones y panel de comments */}
      {activeReel && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => {
            setActiveReel(null);
            setShowCommentsPanel(false);
          }}
        >
          {/* Close button (top-right) */}
          <button
            type="button"
            onClick={() => {
              setActiveReel(null);
              setShowCommentsPanel(false);
            }}
            className="absolute top-4 right-4 z-30 text-white bg-black/60 hover:bg-black/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            aria-label={t('close')}
          >
            ✕
          </button>

          <div
            className="relative w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-2xl overflow-hidden md:flex md:items-stretch bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* VIDEO (left on desktop, fullscreen on mobile) */}
            <div className="relative w-full h-[60vh] md:h-auto md:flex-1 bg-black flex items-center justify-center">
              <iframe
                src={getEmbedUrl(activeReel.videoUrl, { autoplay: true, mute: false })}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />

              {/* Right-side overlay: actions + author (Instagram Reels style) */}
              <div className="absolute right-3 bottom-20 md:bottom-6 z-20 flex flex-col items-center gap-4">
                {/* Author avatar (clickable to profile) */}
                <div className="flex flex-col items-center">
                  {activeReel.user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeReel.user.photo}
                      alt={activeReel.user.name || 'Skater'}
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-white flex items-center justify-center">
                      <span className="text-white font-black text-sm">
                        {(activeReel.user.name || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {activeReel.user.username && (
                    <p className="text-white text-[10px] font-bold mt-1 max-w-[60px] truncate">
                      {activeReel.user.username}
                    </p>
                  )}
                </div>

                {/* Like button (vertical, big) */}
                <button
                  type="button"
                  onClick={(e) => handleLike(activeReel.id, e)}
                  disabled={isLiking}
                  className="flex flex-col items-center gap-1 group"
                  title={session?.user ? (activeReel.userVote === 'upvote' ? t('liked') : t('like')) : t('loginToLike')}
                >
                  {activeReel.userVote === 'upvote' ? (
                    <MdFavorite className="fill-pink-500 text-pink-500" size={36} />
                  ) : (
                    <MdFavoriteBorder className="text-white group-hover:text-pink-400" size={36} />
                  )}
                  <span className="text-white text-xs font-black">
                    {activeReel.upvotes}
                  </span>
                </button>

                {/* Comments button (opens panel) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentsPanel(true);
                  }}
                  className="flex flex-col items-center gap-1 group"
                  title="Comments"
                >
                  <MdChatBubbleOutline className="text-white group-hover:text-cyan-400" size={36} />
                  <span className="text-white text-xs font-black">
                    {activeReel.commentCount}
                  </span>
                </button>
              </div>

              {/* Bottom gradient + author/challenge info (mobile) */}
              <div className="absolute bottom-0 left-0 right-20 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none md:hidden">
                <p className="text-white font-bold text-sm truncate">
                  {activeReel.user.name || 'Skater'}
                </p>
                <p className="text-neutral-300 text-xs truncate">
                  {activeReel.challenge.name}
                </p>
              </div>
            </div>

            {/* COMMENTS PANEL (slides up from bottom on mobile, slides in from right on desktop) */}
            <div
              className={`fixed md:static inset-x-0 bottom-0 md:inset-auto md:w-[400px] md:flex-shrink-0 z-40
                bg-neutral-900 md:bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-700
                transition-transform duration-300 ease-out
                ${showCommentsPanel ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:translate-x-full md:hidden'}
                max-h-[80vh] md:max-h-none md:h-full flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header panel */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <MdChatBubbleOutline className="text-cyan-400" size={18} />
                  {t('topReels.comments', { count: activeReel.commentCount }) || `Comments (${activeReel.commentCount})`}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCommentsPanel(false)}
                  className="md:hidden text-neutral-400 hover:text-white text-2xl leading-none"
                  aria-label={t('close')}
                >
                  ✕
                </button>
              </div>

              {/* Comments list (scrollable) */}
              <div className="flex-1 overflow-y-auto p-4">
                <ReelComments
                  key={`comments-${activeReel.id}`}
                  submissionId={activeReel.id}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
