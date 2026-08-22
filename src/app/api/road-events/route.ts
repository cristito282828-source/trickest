/**
 * POST /api/road-events
 * GET  /api/road-events
 *
 * Endpoint público (sin auth) usado por la app mobile RoadReportApp.
 * Los eventos son anónimos: la identificación es por `deviceId` (fingerprint
 * local del celular), no por usuario.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import {
  postRoadEventsSchema,
  getRoadEventsQuerySchema,
} from './schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_JSON' },
      { status: 400 },
    );
  }

  const parsed = postRoadEventsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { events, deviceInfo } = parsed.data;

  const rows = events.map((e) => ({
    deviceId: deviceInfo.deviceId,
    latitude: e.coords?.latitude ?? null,
    longitude: e.coords?.longitude ?? null,
    accuracy: e.coords?.accuracy ?? null,
    magnitude: e.magnitude,
    eventType: e.eventType,
    confidence: e.confidence ?? null,
    speed: e.speed ?? null,
    bearing: e.bearing ?? null,
    appVersion: deviceInfo.appVersion,
    osVersion: deviceInfo.osVersion,
    deviceModel: deviceInfo.deviceModel,
    detectedAt: new Date(e.timestamp),
  }));

  try {
    const result = await prisma.roadEvent.createMany({
      data: rows,
    });

    return NextResponse.json({
      ok: true,
      received: events.length,
      inserted: result.count,
      duplicates: events.length - result.count,
    });
  } catch (err) {
    console.error('[road-events] POST error:', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = getRoadEventsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { minLat, maxLat, minLng, maxLng, limit, cursor, eventType } =
    parsed.data;

  const where: Record<string, unknown> = {};
  if (eventType) where.eventType = eventType;
  if (
    minLat != null &&
    maxLat != null &&
    minLng != null &&
    maxLng != null
  ) {
    where.latitude = { gte: minLat, lte: maxLat };
    where.longitude = { gte: minLng, lte: maxLng };
  }

  try {
    const events = await prisma.roadEvent.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error('[road-events] GET error:', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}