'use client';

import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

interface MicrosoftClarityProps {
  projectId: string;
}

/**
 * Microsoft Clarity Component - Heatmaps and Session Recordings
 *
 * Microsoft Clarity is a FREE analytics tool that provides:
 * - Heatmaps: See where users click and scroll
 * - Session recordings: Watch user sessions
 * - Dead clicks: Identify clicks that don't work
 * - Rage clicks: Detect frustrated users
 * - Scroll depth: Understand engagement
 *
 * Get your project ID at: https://clarity.microsoft.com/
 *
 * Official NPM Package: @microsoft/clarity
 * Documentation: https://github.com/microsoft/clarity
 *
 * Usage:
 * <MicrosoftClarity projectId="YOUR_PROJECT_ID" />
 */
const MicrosoftClarity = ({ projectId }: MicrosoftClarityProps) => {
  useEffect(() => {
    if (!projectId) {
      console.warn('🔍 [Clarity] No project ID provided');
      return;
    }

    try {
      // Initialize Clarity with the official NPM package
      clarity.init(projectId);
      console.log('✅ [Clarity] Initialized with project ID:', projectId);
    } catch (error) {
      console.error('❌ [Clarity] Failed to initialize:', error);
    }
  }, [projectId]);

  return null; // This component doesn't render anything
};

export default MicrosoftClarity;
