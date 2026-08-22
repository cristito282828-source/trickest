/**
 * Validación Zod para los payloads de /api/road-events.
 *
 * Eventos anónimos detectados por la app RoadReportApp. No se pide auth:
 * la identificación es por deviceId (fingerprint local), no por usuario.
 */

import { z } from 'zod';

const coordsSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().nonnegative().optional(),
  })
  .nullable()
  .optional();

const deviceInfoSchema = z.object({
  appVersion: z.string().min(1).max(20),
  osVersion: z.string().min(1).max(20),
  deviceModel: z.string().min(1).max(60),
  deviceId: z.string().min(1).max(100),
});

const roadEventSchema = z.object({
  localId: z.string().min(1).max(80),
  timestamp: z.number().int().positive(),
  coords: coordsSchema,
  magnitude: z.number().positive().max(200),
  eventType: z
    .enum(['POTHOLE', 'BUMP', 'BRAKE', 'TURN', 'UNKNOWN'])
    .default('POTHOLE'),
  confidence: z.number().min(0).max(1).optional(),
  speed: z.number().nonnegative().optional(),
  bearing: z.number().min(0).max(360).optional(),
});

export const postRoadEventsSchema = z.object({
  events: z.array(roadEventSchema).min(1).max(200),
  deviceInfo: deviceInfoSchema,
});

export type PostRoadEventsInput = z.infer<typeof postRoadEventsSchema>;

export const getRoadEventsQuerySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().min(1).optional(),
  eventType: z
    .enum(['POTHOLE', 'BUMP', 'BRAKE', 'TURN', 'UNKNOWN'])
    .optional(),
});

export type GetRoadEventsQuery = z.infer<typeof getRoadEventsQuerySchema>;