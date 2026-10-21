'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAutoHideDashboardChrome(enabled: boolean, resetKey?: string) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const mobileViewport = window.matchMedia('(max-width: 1023px)');
    if (!enabled || !mobileViewport.matches) {
      setIsVisible(true);
      if (!enabled) return;
    }

    let lastScrollY = 0;
    let lastScroller: EventTarget | null = null;
    let accumulatedDelta = 0;
    let lastDirection: 'up' | 'down' | null = null;

    const handleScroll = (event: Event) => {
      if (!mobileViewport.matches) return;

      const target = event.target;
      const scroller = target instanceof HTMLElement
        ? target
        : document.scrollingElement;
      if (!scroller) return;

      if (lastScroller !== target) {
        lastScroller = target;
        lastScrollY = Math.max(scroller.scrollTop, 0);
        accumulatedDelta = 0;
        lastDirection = null;
        return;
      }

      const scrollY = Math.max(scroller.scrollTop, 0);
      const delta = scrollY - lastScrollY;
      lastScrollY = scrollY;

      if (scrollY <= 24) {
        accumulatedDelta = 0;
        setIsVisible(true);
        return;
      }

      if (delta === 0) return;

      const direction = delta > 0 ? 'down' : 'up';
      accumulatedDelta = direction === lastDirection ? accumulatedDelta + Math.abs(delta) : Math.abs(delta);
      lastDirection = direction;

      if (accumulatedDelta >= 16) {
        setIsVisible(direction === 'up');
        accumulatedDelta = 0;
      }
    };

    const handleViewportChange = () => {
      setIsVisible(true);
      lastScrollY = Math.max(window.scrollY, 0);
      lastScroller = null;
      accumulatedDelta = 0;
      lastDirection = null;
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    mobileViewport.addEventListener('change', handleViewportChange);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      mobileViewport.removeEventListener('change', handleViewportChange);
    };
  }, [enabled, resetKey]);

  const reveal = useCallback(() => setIsVisible(true), []);

  return { isVisible, reveal };
}
