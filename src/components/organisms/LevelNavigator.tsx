'use client';

import React, { useState } from 'react';
import { MdPlayArrow, MdReplay, MdVideoLibrary, MdHelpOutline, MdShare, MdLock } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

export type LevelStatus = 'completed' | 'active' | 'locked';
export type LevelType = 'normal' | 'bonus';

export interface Level {
  id: number;
  status: LevelStatus;
  title: string;
  description?: string;
  type?: LevelType;
  content: {
    mainButton: string;
    mainButtonAction: () => void;
    secondaryButtons?: {
      label: string;
      action: () => void;
      icon?: React.ReactNode;
    }[];
    videoUrl?: string;
  };
}

interface LevelNavigatorProps {
  levels: Level[];
  onLevelChange?: (levelId: number) => void;
  onReplayIntro?: () => void;
  onWatchVideos?: () => void;
  onHowToPlay?: () => void;
  onShare?: () => void;
}

export const LevelNavigator: React.FC<LevelNavigatorProps> = ({
  levels,
  onLevelChange,
  onReplayIntro,
  onWatchVideos,
  onHowToPlay,
  onShare,
}) => {
  const t = useTranslations('levelNavigator');
  const [activeLevel, setActiveLevel] = useState<number>(
    levels.find(l => l.status === 'active')?.id || levels[0]?.id || 1
  );

  const currentLevel = levels.find(l => l.id === activeLevel);

  const handleLevelClick = (level: Level) => {
    if (level.status === 'locked') return;
    setActiveLevel(level.id);
    onLevelChange?.(level.id);
  };

  const getStatusColor = (status: LevelStatus, isActive: boolean) => {
    if (isActive) return 'bg-accent-cyan-500 border-accent-cyan-300 shadow-lg shadow-accent-cyan-500/50';
    if (status === 'completed') return 'bg-accent-yellow-500 border-accent-yellow-300 shadow-md';
    if (status === 'locked') return 'bg-neutral-600 border-neutral-700 cursor-not-allowed';
    return 'bg-accent-purple-600 border-accent-purple-400 shadow-md';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* LEVEL NAVIGATION */}
      <div className="bg-neutral-900 border-4 border-neutral-700 rounded-2xl p-6 shadow-2xl">
        {/* Level circles */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 overflow-x-auto pb-4">
          {levels.map((level, index) => (
            <div key={level.id} className="flex items-center flex-shrink-0">
              {/* Level circle */}
              <button
                onClick={() => handleLevelClick(level)}
                disabled={level.status === 'locked'}
                className={`
                  relative w-12 h-12 md:w-16 md:h-16 rounded-full border-4
                  font-black text-lg md:text-2xl text-white
                  transition-all duration-300 transform hover:scale-110
                  ${getStatusColor(level.status, level.id === activeLevel)}
                  ${level.status === 'locked' ? 'opacity-50' : 'hover:scale-110'}
                  ${level.type === 'bonus' ? 'animate-pulse' : ''}
                `}
              >
                {level.status === 'locked' ? (
                  <MdLock className="w-full h-full p-3" />
                ) : level.status === 'completed' ? (
                  <span>✓</span>
                ) : (
                  <span>{level.id}</span>
                )}

                {/* Bonus badge */}
                {level.type === 'bonus' && level.status !== 'locked' && (
                  <span className="absolute -top-2 -right-2 bg-accent-pink-500 text-white text-xs font-black px-2 py-1 rounded-full border-2 border-white">
                    🌟
                  </span>
                )}
              </button>

              {/* Connector line */}
              {index < levels.length - 1 && (
                <div className={`
                  w-4 md:w-8 h-1 mx-1
                  ${level.status === 'completed' ? 'bg-accent-yellow-500' : 'bg-neutral-700'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Level indicator */}
        <div className="text-center">
          <p className="text-accent-cyan-400 font-black text-sm md:text-base uppercase tracking-wider">
            {t('level')} {activeLevel}
            {currentLevel?.type === 'bonus' && (
              <span className="ml-2 text-accent-pink-500">{`🌟 ${t('bonus')}`}</span>
            )}
          </p>
        </div>
      </div>

      {/* CONTENT AREA */}
      {currentLevel && (
        <div className="relative animate-fadeIn">
          {/* Main content panel */}
          <div className="bg-gradient-to-br from-accent-yellow-400 via-accent-yellow-500 to-accent-orange-500 border-4 border-black rounded-2xl p-1 shadow-2xl">
            <div className="bg-black rounded-xl p-8 md:p-12">
              <div className="text-center space-y-6">
                {/* Title */}
                <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-500 uppercase tracking-wider">
                  {currentLevel.title}
                </h2>

                {/* Description */}
                {currentLevel.description && (
                  <p className="text-neutral-300 text-lg md:text-xl max-w-2xl mx-auto">
                    {currentLevel.description}
                  </p>
                )}

                {/* Main action button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={currentLevel.content.mainButtonAction}
                    variant="purple"
                    size="xl"
                    leftIcon={<MdPlayArrow size={32} />}
                    className="rounded-xl"
                  >
                    {currentLevel.content.mainButton}
                  </Button>
                </div>

                {/* Secondary buttons */}
                {currentLevel.content.secondaryButtons && currentLevel.content.secondaryButtons.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4 pt-4">
                    {currentLevel.content.secondaryButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={btn.action}
                        className="bg-accent-cyan-500 hover:bg-accent-cyan-600 text-white font-black py-3 px-8 rounded-lg border-4 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          {btn.icon}
                          {btn.label}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decorative corner elements */}
          <div className="absolute -top-3 -left-3 w-12 h-12 bg-accent-pink-500 rounded-lg transform rotate-12 animate-pulse" />
          <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-accent-cyan-500 rounded-lg transform -rotate-12 animate-pulse" />
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      <div className="bg-neutral-900 border-4 border-neutral-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="bg-accent-purple-600 hover:bg-accent-purple-700 text-white font-black py-3 px-6 rounded-lg border-2 border-accent-purple-400 uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <MdReplay size={20} />
              {t('replayIntro')}
            </button>
          )}

          {onWatchVideos && (
            <button
              onClick={onWatchVideos}
              className="bg-accent-pink-600 hover:bg-accent-pink-700 text-white font-black py-3 px-6 rounded-lg border-2 border-accent-pink-400 uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <MdVideoLibrary size={20} />
              {t('watchVideos')}
            </button>
          )}

          {onHowToPlay && (
            <button
              onClick={onHowToPlay}
              className="bg-accent-cyan-600 hover:bg-accent-cyan-700 text-white font-black py-3 px-6 rounded-lg border-2 border-accent-cyan-400 uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <MdHelpOutline size={20} />
              {t('howToPlay')}
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="bg-accent-yellow-500 hover:bg-accent-yellow-600 text-black font-black py-3 px-6 rounded-lg border-2 border-accent-yellow-300 uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <MdShare size={20} />
              {t('share')}
            </button>
          )}
        </div>
      </div>

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
};
