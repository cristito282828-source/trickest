'use client';

import { useState, useEffect } from 'react';
import { MdVideoLibrary, MdEmojiEvents, MdLock, MdPlayArrow, MdStars } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import VideoModal from './VideoModal';
import { getYouTubeThumbnail, getYouTubeThumbnailFallback } from '@/lib/youtube';

interface Challenge {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  points: number;
  demoVideoUrl: string;
  isBonus: boolean;
  level: number;
  userSubmission?: {
    id: number;
    status: string;
    score: number | null;
    videoUrl: string;
  } | null;
}

interface LevelSlot {
  id?: number;
  name: string;
  description: string;
  difficulty?: string;
  points?: number;
  demoVideoUrl?: string;
  isLocked: boolean;
  displayLevel: number;
  isBonus?: boolean;
  userSubmission?: {
    id: number;
    status: string;
    score: number | null;
    videoUrl: string;
  } | null;
}

export default function HomeLevelSection() {
  const [allLevels, setAllLevels] = useState<LevelSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState(1);
  const [totalLevels, setTotalLevels] = useState(8);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');
  const t = useTranslations('homeLevelSection');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // Obtener configuración de total de niveles
        const settingsResponse = await fetch('/api/settings?key=total_levels');
        let maxLevels = 8;
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          maxLevels = parseInt(settingsData.value) || 8;
          setTotalLevels(maxLevels);
        }

        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();

          // Separar challenges regulares y bonus
          const regularChallenges = (data.challenges || [])
            .filter((c: Challenge) => !c.isBonus)
            .sort((a: Challenge, b: Challenge) => a.level - b.level);

          const bonusChallenges = (data.challenges || [])
            .filter((c: Challenge) => c.isBonus)
            .sort((a: Challenge, b: Challenge) => a.level - b.level);

          // Crear slots intercalando regulares y bonus
          const levelSlots: LevelSlot[] = [];
          let regularIndex = 0;
          let bonusIndex = 0;
          let totalItemsAdded = 0;

          for (let i = 0; i < maxLevels; i++) {
            const shouldPlaceBonus =
              ((totalItemsAdded === 3 || totalItemsAdded === 6) && bonusIndex < bonusChallenges.length);

            if (shouldPlaceBonus) {
              const bonus = bonusChallenges[bonusIndex];
              levelSlots.push({
                id: bonus.id,
                name: bonus.name,
                description: bonus.description,
                difficulty: bonus.difficulty,
                points: bonus.points,
                demoVideoUrl: bonus.demoVideoUrl,
                isLocked: false,
                isBonus: true,
                displayLevel: i + 1,
                userSubmission: bonus.userSubmission ?? null,
              });
              bonusIndex++;
              totalItemsAdded++;
            } else if (regularIndex < regularChallenges.length) {
              const regular = regularChallenges[regularIndex];
              levelSlots.push({
                id: regular.id,
                name: regular.name,
                description: regular.description,
                difficulty: regular.difficulty,
                points: regular.points,
                demoVideoUrl: regular.demoVideoUrl,
                isLocked: false,
                isBonus: false,
                displayLevel: i + 1,
                userSubmission: regular.userSubmission ?? null,
              });
              regularIndex++;
              totalItemsAdded++;
            } else {
              levelSlots.push({
                name: `__LOCKED_LEVEL__${i + 1}`,
                description: '__LOCKED_DESC__',
                isLocked: true,
                isBonus: false,
                displayLevel: i + 1,
              });
            }
          }

          setAllLevels(levelSlots);
        }
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const currentLevel = allLevels.find((l) => l.displayLevel === activeLevel);

  const handleOpenVideoModal = () => {
    if (currentLevel?.demoVideoUrl) {
      setSelectedVideoUrl(currentLevel.demoVideoUrl);
      setSelectedVideoTitle(currentLevel.name);
      setVideoModalOpen(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500 hover:bg-green-600',
      medium: 'bg-yellow-500 hover:bg-yellow-600',
      hard: 'bg-red-500 hover:bg-red-600',
      expert: 'bg-purple-500 hover:bg-purple-600',
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  // Helper function for level tab styling
  const getLevelTabStyles = (level: LevelSlot) => {
    const baseStyles = "relative w-12 h-12 md:w-16 md:h-16 rounded-full border-4 font-black text-lg md:text-2xl text-white transition-all duration-300 transform flex-shrink-0";

    if (level.isLocked) {
      return `${baseStyles} bg-neutral-600 border-neutral-700 opacity-50 cursor-not-allowed`;
    }

    if (level.isBonus) {
      if (activeLevel === level.displayLevel) {
        return `${baseStyles} bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-500/50 scale-110`;
      }
      return `${baseStyles} bg-yellow-500 border-yellow-400 shadow-md hover:scale-110 animate-pulse`;
    }

    // Regular levels
    if (activeLevel === level.displayLevel) {
      return `${baseStyles} bg-cyan-500 border-cyan-300 shadow-lg shadow-cyan-500/50 scale-110`;
    }
    return `${baseStyles} bg-purple-600 border-purple-400 shadow-md hover:bg-purple-500 hover:scale-110`;
  };

  // Helper function for card gradient
  const getCardGradient = (level: LevelSlot) => {
    if (level.isLocked) {
      return 'from-neutral-600 to-neutral-700 border-neutral-500';
    }
    if (level.isBonus) {
      return 'from-yellow-400 via-pink-500 to-purple-600 border-white';
    }
    return 'from-yellow-400 via-yellow-500 to-orange-500 border-black';
  };

  // Helper function for title gradient
  const getTitleGradient = (level: LevelSlot) => {
    if (level.isLocked) {
      return 'from-neutral-400 to-neutral-500';
    }
    if (level.isBonus) {
      return 'from-yellow-400 via-pink-500 to-purple-500';
    }
    return 'from-yellow-400 to-orange-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-gradient-to-br from-neutral-900 via-purple-900 to-neutral-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-gradient-to-br from-neutral-900 via-purple-900 to-neutral-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 uppercase tracking-wider mb-4">
            {t('title')}
          </h2>
          <p className="text-cyan-300 text-lg md:text-xl max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Level Tabs */}
        <div className="bg-neutral-900 border-4 border-neutral-700 rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 overflow-x-auto pb-4">
            {allLevels.map((level) => {
              return (
              <button
                key={level.displayLevel}
                onClick={() => !level.isLocked && setActiveLevel(level.displayLevel)}
                className={getLevelTabStyles(level)}
                disabled={level.isLocked}
              >
                {level.isLocked ? (
                  <MdLock className="w-full h-full p-3" />
                ) : level.isBonus ? (
                  <MdStars className="w-full h-full p-2" />
                ) : (
                  <span>{level.displayLevel}</span>
                )}
              </button>
            );
            })}
          </div>

          {/* Level indicator */}
          <div className="text-center">
            <p className="text-cyan-400 font-black text-sm md:text-base uppercase tracking-wider">
              {currentLevel?.isBonus ? t('bonusChallenge') : t('level', { level: activeLevel })}
            </p>
          </div>
        </div>

        {/* Content Area */}
        {currentLevel && (
          <div className="relative animate-fadeIn mb-6">
            <div className={`border-4 rounded-2xl p-1 shadow-2xl bg-gradient-to-br ${getCardGradient(currentLevel)}`}>
              <ChallengeCardBackground demoVideoUrl={currentLevel.demoVideoUrl}>
                <div className="text-center space-y-6 relative z-10">
                  {/* Title */}
                  <h2 className={`text-3xl md:text-5xl font-black text-transparent bg-clip-text uppercase tracking-wider bg-gradient-to-r ${getTitleGradient(currentLevel)}`}>
                    {currentLevel.isBonus && '⭐ '}
                    {currentLevel.name.startsWith('__LOCKED_LEVEL__')
                      ? t('levelLocked', { level: currentLevel.name.replace('__LOCKED_LEVEL__', '') })
                      : currentLevel.name}
                  </h2>

                  {/* Difficulty Badge */}
                  {!currentLevel.isLocked && currentLevel.difficulty && (
                    <div className="flex justify-center">
                      <span className={`text-sm md:text-base ${getDifficultyColor(currentLevel.difficulty)} text-white px-4 py-2 rounded-full font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer`}>
                        {currentLevel.difficulty} • {currentLevel.points} pts
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-neutral-300 text-lg md:text-xl max-w-2xl mx-auto">
                    {currentLevel.description === '__LOCKED_DESC__'
                      ? t('levelLockedDesc')
                      : currentLevel.description}
                  </p>

                  {/* Submission status badge */}
                  {currentLevel.userSubmission && !currentLevel.isLocked && (
                    <div className="flex justify-center">
                      <span
                        className={`text-xs md:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-lg ${
                          currentLevel.userSubmission.status === 'pending'
                            ? 'bg-yellow-500'
                            : currentLevel.userSubmission.status === 'approved'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {currentLevel.userSubmission.status === 'pending' && (t('evaluating') || 'EN CALIFICACIÓN')}
                        {currentLevel.userSubmission.status === 'approved' && (t('approved') || 'APROBADO')}
                        {currentLevel.userSubmission.status === 'rejected' && (t('rejected') || 'RECHAZADO')}
                        {currentLevel.userSubmission.score != null && ` • ${currentLevel.userSubmission.score} pts`}
                      </span>
                    </div>
                  )}

                  {/* Main action button */}
                  {!currentLevel.isLocked ? (
                    <>
                      <div className="flex justify-center pt-4">
                        {currentLevel.userSubmission ? (
                          (() => {
                            const status = currentLevel.userSubmission.status;
                            let btnLabel = t('evaluating') || 'EN CALIFICACIÓN';
                            let btnClass = 'bg-yellow-500 cursor-not-allowed';
                            let btnIcon = <MdStars size={32} />;
                            if (status === 'approved') {
                              btnLabel = t('approved') || 'APROBADO';
                              btnClass = 'bg-green-500 cursor-not-allowed';
                              btnIcon = <MdEmojiEvents size={32} />;
                            } else if (status === 'rejected') {
                              btnLabel = t('rejected') || 'RECHAZADO';
                              btnClass = 'bg-red-500 cursor-not-allowed';
                              btnIcon = <MdLock size={32} />;
                            }
                            return (
                              <div
                                className={`${btnClass} text-white font-black text-xl md:text-2xl py-4 px-12 md:px-16 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl inline-block`}
                              >
                                <div className="flex items-center gap-3">
                                  {btnIcon}
                                  {btnLabel}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          // Sin submission: link a la página de detalle
                          <Link
                            href={currentLevel.name ? `/dashboard/skaters/tricks/${encodeURIComponent(currentLevel.name)}` : '/dashboard/skaters/tricks'}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xl md:text-2xl py-4 px-12 md:px-16 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all inline-block"
                          >
                            <div className="flex items-center gap-3">
                              <MdPlayArrow size={32} />
                              {activeLevel === 1 ? t('startChallenge') : t('viewChallenge')}
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Secondary buttons */}
                      {currentLevel.demoVideoUrl && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={handleOpenVideoModal}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-black py-3 px-8 rounded-lg border-4 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <MdVideoLibrary size={20} />
                              {t('watchDemo')}
                            </div>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-center pt-4">
                      <div className="text-neutral-500 text-xl font-black uppercase tracking-wider flex items-center gap-3">
                        <MdLock size={32} />
                        {t('comingSoon')}
                      </div>
                    </div>
                  )}
                </div>
              </ChallengeCardBackground>
            </div>

            {/* Decorative corner elements */}
            <div className={`absolute -top-3 -left-3 w-12 h-12 rounded-lg transform rotate-12 ${
              currentLevel.isLocked ? 'bg-neutral-600' : 'bg-pink-500 animate-pulse'
            }`} />
            <div className={`absolute -bottom-3 -right-3 w-12 h-12 rounded-lg transform -rotate-12 ${
              currentLevel.isLocked ? 'bg-neutral-600' : 'bg-cyan-500 animate-pulse'
            }`} />
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/dashboard/skaters/tricks"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-black text-lg md:text-xl py-4 px-10 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all"
          >
            <div className="flex items-center gap-3">
              <MdEmojiEvents size={28} />
              {t('viewAllChallenges')}
            </div>
          </Link>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={selectedVideoUrl}
        title={selectedVideoTitle}
      />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Wrapper que muestra el thumbnail de YouTube como fondo del card
 * con fallback automático a hqdefault y overlay oscuro para legibilidad
 */
function ChallengeCardBackground({
  demoVideoUrl,
  children,
}: {
  demoVideoUrl?: string;
  children: React.ReactNode;
}) {
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    if (demoVideoUrl) {
      // Empezar directamente con hqdefault (480x360) que SIEMPRE existe en YouTube
      setThumbSrc(getYouTubeThumbnailFallback(demoVideoUrl));
      setTriedFallback(true); // ya no intentar fallback
    } else {
      setThumbSrc(null);
    }
  }, [demoVideoUrl]);

  if (!thumbSrc) {
    return (
      <div className="bg-black rounded-xl p-8 md:p-12">
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl p-8 md:p-12 bg-cover bg-center bg-no-repeat overflow-hidden min-h-[400px]"
      style={{ backgroundImage: `url(${thumbSrc})` }}
    >
      {/* Overlay oscuro para legibilidad del texto */}
      <div className="absolute inset-0 bg-black/70 rounded-xl" />
      {/* Gradiente extra para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70 rounded-xl" />
      {children}
    </div>
  );
}
