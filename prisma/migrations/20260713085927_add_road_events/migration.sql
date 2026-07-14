-- CreateTable
CREATE TABLE "RoadEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "magnitude" DOUBLE PRECISION NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'POTHOLE',
    "confidence" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "appVersion" TEXT NOT NULL,
    "osVersion" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoadEvent_latitude_longitude_idx" ON "RoadEvent"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "RoadEvent_createdAt_idx" ON "RoadEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RoadEvent_eventType_idx" ON "RoadEvent"("eventType");

-- CreateIndex
CREATE INDEX "RoadEvent_deviceId_idx" ON "RoadEvent"("deviceId");

-- CreateIndex
CREATE INDEX "RoadEvent_detectedAt_idx" ON "RoadEvent"("detectedAt");