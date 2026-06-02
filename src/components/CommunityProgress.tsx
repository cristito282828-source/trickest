'use client';

import { useEffect, useState } from 'react';

interface MilestoneProgress {
  id: string;
  name: string;
  description: string;
  type: string;
  current: number;
  target: number;
  percentage: number;
  points: number;
}

interface CommunityProgressData {
  userCount: number;
  videoCount: number;
  evaluationCount: number;
  nextMilestone: MilestoneProgress | null;
}

/**
 * Community Progress Banner
 * Shows progress toward next dynamic challenge milestone
 */
export default function CommunityProgress() {
  const [data, setData] = useState<CommunityProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    // Refresh every 30 seconds
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/dynamic-challenges/progress');
      const progressData = await response.json();
      setData(progressData);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data?.nextMilestone) {
    return null;
  }

  const { nextMilestone } = data;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 p-4 rounded-lg border-4 border-white shadow-2xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white text-lg">
          🎯 {nextMilestone.name}
        </h3>
        <span className="text-white font-bold text-xl">
          {nextMilestone.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/20 rounded-full h-4 mb-3 overflow-hidden">
        <div
          className="bg-white h-full rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${nextMilestone.percentage}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="flex justify-between items-center text-white text-sm">
        <span>
          {nextMilestone.current} / {nextMilestone.target} {nextMilestone.type}
        </span>
        <span className="font-bold">
          +{nextMilestone.points} pts
        </span>
      </div>

      {nextMilestone.description && (
        <p className="text-white/90 text-xs mt-2 italic">
          {nextMilestone.description}
        </p>
      )}
    </div>
  );
}
