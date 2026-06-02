'use client';

import { Button, ButtonProps } from '@nextui-org/react';
import { useCallback } from 'react';

interface TrackedButtonProps extends ButtonProps {
  /**
   * Button name for analytics tracking
   * @example "submit_video", "save_profile", "join_team"
   */
  trackingName: string;

  /**
   * Button location for analytics tracking
   * @example "header", "sidebar", "challenge_card", "modal"
   */
  trackingLocation: string;

  /**
   * Children elements
   */
  children: React.ReactNode;

  /**
   * Optional additional tracking data
   */
  trackingParams?: Record<string, any>;
}

/**
 * Button component that automatically tracks clicks in Google Analytics 4
 *
 * Usage:
 * <TrackedButton
 *   trackingName="submit_video"
 *   trackingLocation="challenge_modal"
 *   color="primary"
 *   onClick={handleSubmit}
 * >
 *   Submit Video
 * </TrackedButton>
 */
export default function TrackedButton({
  trackingName,
  trackingLocation,
  trackingParams,
  children,
  onClick,
  ...props
}: TrackedButtonProps) {
  const handleClick = useCallback(
    (e: any) => {
      // Track the button click
      trackButtonClick(trackingName, trackingLocation, trackingParams);

      // Call original onClick if provided
      if (onClick) {
        onClick(e as any);
      }
    },
    [trackingName, trackingLocation, trackingParams, onClick]
  );

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

/**
 * Track button click event
 */
function trackButtonClick(name: string, location: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'button_clicked', {
      button_name: name,
      button_location: location,
      ...params,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 [GA4] Button clicked: ${name} at ${location}`, params || '');
  }
}
