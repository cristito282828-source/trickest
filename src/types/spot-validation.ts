// Tipos para el Sistema de Validación Social de Spots

export enum SpotType {
  SKATEPARK = 'SKATEPARK',
  SKATESHOP = 'SKATESHOP',
  SPOT = 'SPOT'
}

export enum SpotStage {
  GHOST = 'GHOST',
  REVIEW = 'REVIEW',
  VERIFIED = 'VERIFIED',
  LEGENDARY = 'LEGENDARY',
  STALE = 'STALE',
  DEAD = 'DEAD'
}

export enum ValidationMethod {
  GPS_PROXIMITY = 'GPS_PROXIMITY',
  PHOTO_UPLOAD = 'PHOTO_UPLOAD',
  LIVE_PHOTO = 'LIVE_PHOTO',
  CHECK_IN = 'CHECK_IN',
  CROWD_REPORT = 'CROWD_REPORT'
}

export enum CrowdLevel {
  EMPTY = 'EMPTY',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  BUSY = 'BUSY',
  CROWDED = 'CROWDED'
}

export interface SpotStatusHistory {
  stage: SpotStage;
  confidenceScore: number;
  timestamp: Date;
  reason: string;
}

export interface Spot {
  id: number;
  uuid?: string;
  name: string;
  type: SpotType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  stage: SpotStage;
  lastVerifiedAt: Date;
  statusHistory: SpotStatusHistory[];
  isHot: boolean;
  hotUntil?: Date;
  lastActivityAt: Date;
  staleAt?: Date;
  deadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotValidation {
  id: number;
  spotId: number;
  userId: string;
  userWeight: number;
  method: ValidationMethod;
  validatedLat?: number;
  validatedLng?: number;
  accuracy?: number;
  createdAt: Date;
}

export interface SpotCheckIn {
  id: number;
  spotId: number;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  crowdLevel?: CrowdLevel;
  isOpen?: boolean;
  createdAt: Date;
}

export interface UserReputation {
  id: number;
  userId: string;
  reputationScore: number;
  level: string;
  validationWeight: number;
  validationsGiven: number;
  spotsVerified: number;
  badges: string[];
}
