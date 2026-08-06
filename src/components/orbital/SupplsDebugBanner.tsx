'use client';

import { useEffect, useState } from 'react';

interface SupplsDebugBannerProps {
  productsCount: number;
}

/**
 * Banner de debug SIEMPRE visible en /suppls.
 * Se monta aunque no haya productos. Hace su propio fetch a /api/external-products
 * para mostrar datos del cliente (lo que el browser ve, no lo que el server cached).
 */
export default function SupplsDebugBanner({ productsCount }: SupplsDebugBannerProps) {
  const [apiData, setApiData] = useState<{
    status: number | null;
    count: number | null;
    error: string | null;
    firstProduct: { id: string; name: string; image: { sourceUrl?: string } | null } | null;
    fetchedAt: string | null;
  }>({
    status: null,
    count: null,
    error: null,
    firstProduct: null,
    fetchedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchDebugData() {
      try {
        const startTime = Date.now();
        const res = await fetch('/api/external-products?limit=8');
        const elapsed = Date.now() - startTime;

        if (!res.ok) {
          if (!cancelled) {
            setApiData({
              status: res.status,
              count: null,
              error: `HTTP ${res.status} ${res.statusText}`,
              firstProduct: null,
              fetchedAt: new Date().toISOString(),
            });
          }
          console.error('[SupplsDebugBanner] API error:', res.status, res.statusText);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        setApiData({
          status: res.status,
          count: json.count ?? json.products?.length ?? 0,
          error: json.error ?? null,
          firstProduct: json.products?.[0] ?? null,
          fetchedAt: new Date().toISOString(),
        });

        console.log('[SupplsDebugBanner] API response:', {
          status: res.status,
          count: json.count,
          productsLength: json.products?.length,
          elapsed,
          category: json.category,
        });
      } catch (err) {
        if (!cancelled) {
          setApiData({
            status: 0,
            count: null,
            error: err instanceof Error ? err.message : String(err),
            firstProduct: null,
            fetchedAt: new Date().toISOString(),
          });
        }
        console.error('[SupplsDebugBanner] Fetch error:', err);
      }
    }

    fetchDebugData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      data-testid="suppls-debug-banner"
      style={{
        background: '#000',
        color: '#0f0',
        border: '3px solid #ff0',
        padding: '16px',
        margin: '0 0 16px 0',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: '1.5',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
{`=== SUPPLS CLIENT DEBUG ${new Date().toISOString()} ===

Server-rendered products.length:    ${productsCount}
URL actual:                          ${typeof window !== 'undefined' ? window.location.href : '(SSR)'}

API call: GET /api/external-products?limit=8
  HTTP status:     ${apiData.status ?? '(esperando...)'}
  Products count:  ${apiData.count ?? '(esperando...)'}
  Error:           ${apiData.error ?? '(none)'}
  Fetched at:      ${apiData.fetchedAt ?? '(esperando...)'}

First product from API:
${apiData.firstProduct
  ? JSON.stringify(apiData.firstProduct, null, 2)
  : '(none)'}

DIAGNÓSTICO:
- Si apiData.count es 0 → el server fetch está fallando. Ver logs de Vercel.
- Si apiData.error existe → error de red o CORS. Ver server.js config.
- Si server-rendered > 0 pero la página dice "No products" → deploy desactualizado.
- Si apiData.count > 0 pero server-rendered = 0 → el server renderizó antes que el client fetch funcionara. Recargá con ?nocache=1
`}
    </div>
  );
}
