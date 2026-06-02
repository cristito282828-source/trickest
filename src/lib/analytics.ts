/**
 * Google Analytics 4 Event Tracking Utilities
 *
 * Event types for Trickest platform
 * Documentation: https://developers.google.com/analytics/devguides/collection/ga4/events
 */

// Declare gtag on window interface
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track custom event in GA4
 * @param eventName - Name of the event (e.g., 'submit_video')
 * @param params - Event parameters as key-value pairs
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
    console.log(`📊 [GA4] Event tracked: ${eventName}`, params);
  } else {
    console.warn('⚠️ [GA4] gtag not available, event not tracked:', eventName);
  }
};

/**
 * Track page view
 * @param pagePath - Path of the page (e.g., '/dashboard')
 * @param pageTitle - Title of the page
 */
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_path: pagePath,
    });
  }
};

// ============================================================================
// AUTHENTICATION EVENTS
// ============================================================================

export const trackSignUp = (method: 'Google' | 'Email') => {
  trackEvent('sign_up', {
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogin = (method: 'Google' | 'Email') => {
  trackEvent('login', {
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogout = () => {
  trackEvent('logout', {
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ONBOARDING EVENTS
// ============================================================================

export const trackProfileCompletionStep = (step: number, stepName: string) => {
  trackEvent('profile_completion_step', {
    step,
    step_name: stepName,
    timestamp: new Date().toISOString(),
  });
};

export const trackProfileCompleted = () => {
  trackEvent('profile_completed', {
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// CHALLENGE EVENTS
// ============================================================================

export const trackChallengeViewed = (challengeId: string, level: number) => {
  trackEvent('challenge_viewed', {
    challenge_id: challengeId,
    challenge_level: level,
    timestamp: new Date().toISOString(),
  });
};

export const trackVideoSubmitted = (challengeId: string, level: number, videoUrl: string) => {
  trackEvent('video_submitted', {
    challenge_id: challengeId,
    challenge_level: level,
    has_video: !!videoUrl,
    timestamp: new Date().toISOString(),
  });
};

export const trackSubmissionEvaluated = (submissionId: string, score: number, status: 'approved' | 'rejected') => {
  trackEvent('submission_evaluated', {
    submission_id: submissionId,
    score,
    status,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// TEAM EVENTS
// ============================================================================

export const trackTeamCreated = (teamSize: number) => {
  trackEvent('team_created', {
    team_size: teamSize,
    timestamp: new Date().toISOString(),
  });
};

export const trackTeamJoined = (teamId: string) => {
  trackEvent('team_joined', {
    team_id: teamId,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

export const trackButtonClicked = (buttonName: string, buttonLocation: string) => {
  trackEvent('button_clicked', {
    button_name: buttonName,
    button_location: buttonLocation,
    timestamp: new Date().toISOString(),
  });
};

export const trackVideoPlayed = (videoType: 'demo' | 'submission') => {
  trackEvent('video_played', {
    video_type: videoType,
    timestamp: new Date().toISOString(),
  });
};

export const trackLeaderboardViewed = (filter?: 'all' | 'teams' | 'individual') => {
  trackEvent('leaderboard_viewed', {
    filter: filter || 'all',
    timestamp: new Date().toISOString(),
  });
};

export const trackProfileViewed = (profileId: string) => {
  trackEvent('profile_viewed', {
    profile_id: profileId,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// SEARCH & NAVIGATION EVENTS
// ============================================================================

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    timestamp: new Date().toISOString(),
  });
};

export const trackNavigationClick = (destination: string, navigationType: 'sidebar' | 'header' | 'footer') => {
  trackEvent('navigation_click', {
    destination,
    navigation_type: navigationType,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// SOCIAL SHARING EVENTS
// ============================================================================

export const trackContentShared = (contentType: 'challenge' | 'profile' | 'team', platform: string, contentId: string) => {
  trackEvent('share', {
    content_type: contentType,
    item_id: contentId,
    method: platform,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ERROR TRACKING
// ============================================================================

export const trackError = (errorDescription: string, errorContext: string) => {
  trackEvent('error', {
    description: errorDescription,
    context: errorContext,
    timestamp: new Date().toISOString(),
  });
};
