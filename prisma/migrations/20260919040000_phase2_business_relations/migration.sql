ALTER TABLE "Service" ADD COLUMN "parentServiceId" TEXT;

CREATE TABLE "ServiceMedia" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ServiceMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRelation" (
  "sourceServiceId" TEXT NOT NULL,
  "targetServiceId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ServiceRelation_pkey" PRIMARY KEY ("sourceServiceId","targetServiceId")
);

CREATE UNIQUE INDEX "ServiceMedia_serviceId_mediaId_role_key" ON "ServiceMedia"("serviceId","mediaId","role");
CREATE INDEX "ServiceMedia_mediaId_idx" ON "ServiceMedia"("mediaId");
CREATE INDEX "ServiceMedia_serviceId_sortOrder_idx" ON "ServiceMedia"("serviceId","sortOrder");
CREATE INDEX "ServiceRelation_targetServiceId_idx" ON "ServiceRelation"("targetServiceId");
CREATE INDEX "Service_parentServiceId_idx" ON "Service"("parentServiceId");

ALTER TABLE "Service" ADD CONSTRAINT "Service_parentServiceId_fkey" FOREIGN KEY ("parentServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceMedia" ADD CONSTRAINT "ServiceMedia_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceMedia" ADD CONSTRAINT "ServiceMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRelation" ADD CONSTRAINT "ServiceRelation_sourceServiceId_fkey" FOREIGN KEY ("sourceServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRelation" ADD CONSTRAINT "ServiceRelation_targetServiceId_fkey" FOREIGN KEY ("targetServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
