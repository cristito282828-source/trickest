'use client';

import { useCallback, useEffect } from 'react';

/**
 * React Hook for Google Analytics 4 Event Tracking
 *
 * Usage:
 * const analytics = useAnalytics();
 * analytics.trackSignUp('Google');
 */
export const useAnalytics = () => {
  // Track page view on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pagePath = window.location.pathname;
      const pageTitle = document.title;
      trackPageView(pagePath, pageTitle);
    }
  }, []);

  const trackSignUp = useCallback((method: 'Google' | 'Email') => {
    trackEvent('sign_up', { method });
  }, []);

  const trackLogin = useCallback((method: 'Google' | 'Email') => {
    trackEvent('login', { method });
  }, []);

  const trackLogout = useCallback(() => {
    trackEvent('logout', {});
  }, []);

  const trackChallengeViewed = useCallback((challengeId: string, level: number) => {
    trackEvent('challenge_viewed', { challenge_id: challengeId, challenge_level: level });
  }, []);

  const trackVideoSubmitted = useCallback((challengeId: string, level: number) => {
    trackEvent('video_submitted', { challenge_id: challengeId, challenge_level: level });
  }, []);

  const trackSubmissionEvaluated = useCallback((submissionId: string, score: number, status: 'approved' | 'rejected') => {
    trackEvent('submission_evaluated', { submission_id: submissionId, score, status });
  }, []);

  const trackButtonClicked = useCallback((buttonName: string, location: string) => {
    trackEvent('button_clicked', { button_name: buttonName, button_location: location });
  }, []);

  const trackVideoPlayed = useCallback((videoType: 'demo' | 'submission') => {
    trackEvent('video_played', { video_type: videoType });
  }, []);

  const trackTeamCreated = useCallback((teamSize: number) => {
    trackEvent('team_created', { team_size: teamSize });
  }, []);

  const trackProfileViewed = useCallback((profileId: string) => {
    trackEvent('profile_viewed', { profile_id: profileId });
  }, []);

  const trackLeaderboardViewed = useCallback((filter?: 'all' | 'teams' | 'individual') => {
    trackEvent('leaderboard_viewed', { filter: filter || 'all' });
  }, []);

  const trackNavigationClick = useCallback((destination: string, type: 'sidebar' | 'header' | 'footer') => {
    trackEvent('navigation_click', { destination, navigation_type: type });
  }, []);

  const trackShare = useCallback((contentType: 'challenge' | 'profile' | 'team', platform: string, contentId: string) => {
    trackEvent('share', { content_type: contentType, item_id: contentId, method: platform });
  }, []);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    trackEvent('search', { search_term: searchTerm, results_count: resultsCount });
  }, []);

  const trackError = useCallback((description: string, context: string) => {
    trackEvent('error', { description, context });
  }, []);

  return {
    trackSignUp,
    trackLogin,
    trackLogout,
    trackChallengeViewed,
    trackVideoSubmitted,
    trackSubmissionEvaluated,
    trackButtonClicked,
    trackVideoPlayed,
    trackTeamCreated,
    trackProfileViewed,
    trackLeaderboardViewed,
    trackNavigationClick,
    trackShare,
    trackSearch,
    trackError,
  };
};

// Helper function to track events
function trackEvent(eventName: string, params: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
    console.log(`📊 [GA4] Event tracked: ${eventName}`, params);
  } else {
    console.warn('⚠️ [GA4] gtag not available, event not tracked:', eventName);
  }
}

function trackPageView(pagePath: string, pageTitle: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_title: pageTitle,
      page_path: pagePath,
    });
  }
}
