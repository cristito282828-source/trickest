'use client';

import Script from 'next/script';
import { useEffect } from 'react';

// Extend Window interface to include gtag and dataLayer
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google Analytics component using gtag.js
 * Uses Next.js Script component for optimal loading performance
 */
const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      console.log('🔍 [GA DEBUG] Component mounted');
      console.log('🔍 [GA DEBUG] Measurement ID:', measurementId);
    }
  }, [measurementId, isDevelopment]);

  if (!measurementId) {
    if (typeof window !== 'undefined') {
      console.warn('❌ [GA ERROR] No measurement ID provided');
    }
    return null;
  }

  if (typeof window !== 'undefined' && isDevelopment) {
    console.log('✅ [GA INFO] Initializing with ID:', measurementId);
  }

  return (
    <>
      {/* Load gtag.js script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (isDevelopment) {
            console.log('✅ [GA SUCCESS] gtag.js script loaded');
          }
        }}
        onError={(e) => {
          console.error('❌ [GA ERROR] Failed to load gtag.js:', e);
        }}
      />

      {/* Initialize gtag */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          (function() {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              ${isDevelopment ? 'debug_mode: true,' : ''}
              send_page_view: true
            });
          })();
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics;
