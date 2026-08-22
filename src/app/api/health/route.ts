import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      WC_GRAPHQL_URL: process.env.WC_GRAPHQL_URL || null,
      WC_FEATURED_CATEGORY: process.env.WC_FEATURED_CATEGORY || null,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
    },
  });
}
