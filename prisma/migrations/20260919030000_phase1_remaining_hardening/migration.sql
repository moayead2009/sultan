-- Phase 1 schema/index reconciliation.
-- These indexes already exist in schema.prisma and are materialized here for deployed databases.

CREATE INDEX "User_status_email_idx" ON "User"("status", "email");
CREATE INDEX "PageSectionMedia_mediaId_idx" ON "PageSectionMedia"("mediaId");
CREATE INDEX "ServiceFeature_serviceId_sortOrder_idx" ON "ServiceFeature"("serviceId", "sortOrder");
CREATE INDEX "ProjectMedia_mediaId_idx" ON "ProjectMedia"("mediaId");
CREATE INDEX "MediaAsset_kind_createdAt_idx" ON "MediaAsset"("kind", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
