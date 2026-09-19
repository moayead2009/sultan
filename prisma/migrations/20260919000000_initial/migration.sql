-- Initial Solutions Gate schema. Generated to match prisma/schema.prisma.
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "Locale" AS ENUM ('en', 'ar');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'CLOSED', 'SPAM');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE "CapabilityValueKind" AS ENUM ('TEXT', 'BOOLEAN', 'NONE');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'ADMIN',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SiteSettings" (
  "id" TEXT PRIMARY KEY DEFAULT 'site',
  "defaultLocale" "Locale" NOT NULL DEFAULT 'ar',
  "brandNameEnglish" TEXT,
  "brandNameArabic" TEXT,
  "websiteUrl" TEXT,
  "primaryLogoId" TEXT,
  "alternateLogoId" TEXT,
  "faviconId" TEXT,
  "defaultOgImageId" TEXT,
  "contactPhonePrimary" TEXT,
  "contactPhoneSecondary" TEXT,
  "contactEmail" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "region" TEXT,
  "country" TEXT,
  "postalCode" TEXT,
  "mapUrl" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "copyrightEnglish" TEXT,
  "copyrightArabic" TEXT,
  "contactFormEnabled" BOOLEAN NOT NULL DEFAULT false,
  "inquiryRecipient" TEXT,
  "inquiryRetentionDays" INTEGER,
  "inquiryFormNoticeEn" TEXT,
  "inquiryFormNoticeAr" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SocialLink" (
  "id" TEXT PRIMARY KEY,
  "platform" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Page" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "template" TEXT NOT NULL,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PageTranslation" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL REFERENCES "Page"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "navigationLabel" TEXT,
  "eyebrow" TEXT,
  "summary" TEXT,
  "content" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("pageId","locale")
);

CREATE TABLE "PageSection" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL REFERENCES "Page"("id") ON DELETE CASCADE,
  "key" TEXT NOT NULL,
  "sectionType" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "primaryMediaId" TEXT,
  "secondaryMediaId" TEXT,
  "primaryCtaPageId" TEXT,
  "primaryCtaUrl" TEXT,
  "secondaryCtaPageId" TEXT,
  "secondaryCtaUrl" TEXT,
  "settingsVersion" INTEGER NOT NULL DEFAULT 1,
  "settingsJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("pageId","key")
);

CREATE TABLE "PageSectionTranslation" (
  "id" TEXT PRIMARY KEY,
  "sectionId" TEXT NOT NULL REFERENCES "PageSection"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "body" TEXT,
  "primaryCtaLabel" TEXT,
  "secondaryCtaLabel" TEXT,
  "accessibleLabel" TEXT,
  UNIQUE("sectionId","locale")
);

CREATE TABLE "NavigationMenu" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "NavigationItem" (
  "id" TEXT PRIMARY KEY,
  "menuId" TEXT NOT NULL REFERENCES "NavigationMenu"("id") ON DELETE CASCADE,
  "parentId" TEXT REFERENCES "NavigationItem"("id") ON DELETE CASCADE,
  "internalPageId" TEXT REFERENCES "Page"("id") ON DELETE SET NULL,
  "customUrl" TEXT,
  "targetBlank" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "NavigationItemTranslation" (
  "id" TEXT PRIMARY KEY,
  "navigationItemId" TEXT NOT NULL REFERENCES "NavigationItem"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "label" TEXT NOT NULL,
  UNIQUE("navigationItemId","locale")
);

CREATE TABLE "ServiceCategory" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ServiceCategoryTranslation" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "ServiceCategory"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT,
  "detailedIntro" TEXT,
  UNIQUE("categoryId","locale")
);

CREATE TABLE "Service" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT,
  "slug" TEXT NOT NULL UNIQUE,
  "iconMediaId" TEXT,
  "coverMediaId" TEXT,
  "primaryCtaUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ServiceTranslation" (
  "id" TEXT PRIMARY KEY,
  "serviceId" TEXT NOT NULL REFERENCES "Service"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "detailedContent" TEXT NOT NULL,
  "ctaLabel" TEXT,
  UNIQUE("serviceId","locale")
);

CREATE TABLE "ServiceFeature" (
  "id" TEXT PRIMARY KEY,
  "serviceId" TEXT NOT NULL REFERENCES "Service"("id") ON DELETE CASCADE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ServiceFeatureTranslation" (
  "id" TEXT PRIMARY KEY,
  "serviceFeatureId" TEXT NOT NULL REFERENCES "ServiceFeature"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  UNIQUE("serviceFeatureId","locale")
);

CREATE TABLE "ProjectCategory" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ProjectCategoryTranslation" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "ProjectCategory"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  UNIQUE("categoryId","locale")
);

CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY,
  "logoId" TEXT,
  "externalUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "identityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "publicDisplayApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ClientTranslation" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  UNIQUE("clientId","locale")
);

CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "categoryId" TEXT REFERENCES "ProjectCategory"("id") ON DELETE SET NULL,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
  "location" TEXT,
  "year" INTEGER,
  "coverMediaId" TEXT,
  "videoMediaId" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ProjectTranslation" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "detailedDescription" TEXT,
  "challenge" TEXT,
  "solution" TEXT,
  "results" TEXT,
  UNIQUE("projectId","locale")
);

CREATE TABLE "ProcessStep" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "number" TEXT NOT NULL,
  "iconMediaId" TEXT,
  "imageMediaId" TEXT,
  "link" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ProcessStepTranslation" (
  "id" TEXT PRIMARY KEY,
  "processStepId" TEXT NOT NULL REFERENCES "ProcessStep"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  UNIQUE("processStepId","locale")
);

CREATE TABLE "Metric" (
  "id" TEXT PRIMARY KEY,
  "displayValue" TEXT NOT NULL,
  "suffix" TEXT,
  "iconMediaId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "sourceNote" TEXT NOT NULL,
  "lastConfirmedAt" TIMESTAMP(3)
);

CREATE TABLE "MetricTranslation" (
  "id" TEXT PRIMARY KEY,
  "metricId" TEXT NOT NULL REFERENCES "Metric"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  UNIQUE("metricId","locale")
);

CREATE TABLE "CapabilityPackage" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "needsOwnerLabel" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "CapabilityPackageTranslation" (
  "id" TEXT PRIMARY KEY,
  "capabilityPackageId" TEXT NOT NULL REFERENCES "CapabilityPackage"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  UNIQUE("capabilityPackageId","locale")
);

CREATE TABLE "CapabilityFeature" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "CapabilityFeatureTranslation" (
  "id" TEXT PRIMARY KEY,
  "capabilityFeatureId" TEXT NOT NULL REFERENCES "CapabilityFeature"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  UNIQUE("capabilityFeatureId","locale")
);

CREATE TABLE "CapabilityValue" (
  "id" TEXT PRIMARY KEY,
  "capabilityPackageId" TEXT NOT NULL REFERENCES "CapabilityPackage"("id") ON DELETE CASCADE,
  "capabilityFeatureId" TEXT NOT NULL REFERENCES "CapabilityFeature"("id") ON DELETE CASCADE,
  "valueKind" "CapabilityValueKind" NOT NULL DEFAULT 'TEXT',
  "booleanValue" BOOLEAN,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  UNIQUE("capabilityPackageId","capabilityFeatureId")
);

CREATE TABLE "CapabilityValueTranslation" (
  "id" TEXT PRIMARY KEY,
  "capabilityValueId" TEXT NOT NULL REFERENCES "CapabilityValue"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "content" TEXT,
  UNIQUE("capabilityValueId","locale")
);

CREATE TABLE "LeadershipMember" (
  "id" TEXT PRIMARY KEY,
  "imageId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE "LeadershipMemberTranslation" (
  "id" TEXT PRIMARY KEY,
  "leadershipMemberId" TEXT NOT NULL REFERENCES "LeadershipMember"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "biographyOrMessage" TEXT NOT NULL,
  UNIQUE("leadershipMemberId","locale")
);

CREATE TABLE "ContactPerson" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT,
  "email" TEXT,
  "organization" TEXT,
  "imageId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ContactPersonTranslation" (
  "id" TEXT PRIMARY KEY,
  "contactPersonId" TEXT NOT NULL REFERENCES "ContactPerson"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  UNIQUE("contactPersonId","locale")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT PRIMARY KEY,
  "storageKey" TEXT NOT NULL UNIQUE,
  "publicUrl" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
  "byteSize" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "checksum" TEXT,
  "uploadedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "MediaAssetTranslation" (
  "id" TEXT PRIMARY KEY,
  "mediaAssetId" TEXT NOT NULL REFERENCES "MediaAsset"("id") ON DELETE CASCADE,
  "locale" "Locale" NOT NULL,
  "altText" TEXT,
  "caption" TEXT,
  UNIQUE("mediaAssetId","locale")
);

CREATE TABLE "PageSectionMedia" (
  "sectionId" TEXT NOT NULL REFERENCES "PageSection"("id") ON DELETE CASCADE,
  "mediaId" TEXT NOT NULL REFERENCES "MediaAsset"("id") ON DELETE RESTRICT,
  "role" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY("sectionId","mediaId","role")
);

CREATE TABLE "ProjectMedia" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "mediaId" TEXT NOT NULL REFERENCES "MediaAsset"("id") ON DELETE RESTRICT,
  "role" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  UNIQUE("projectId","mediaId","role")
);

CREATE TABLE "ProjectService" (
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "serviceId" TEXT NOT NULL REFERENCES "Service"("id") ON DELETE RESTRICT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY("projectId","serviceId")
);

CREATE TABLE "MediaUsage" (
  "id" TEXT PRIMARY KEY,
  "mediaAssetId" TEXT NOT NULL REFERENCES "MediaAsset"("id") ON DELETE CASCADE,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "usageRole" TEXT NOT NULL,
  "isPublishedReference" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("mediaAssetId","ownerType","ownerId","usageRole")
);

CREATE TABLE "SeoMetadata" (
  "id" TEXT PRIMARY KEY,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "canonicalOverride" TEXT,
  "robots" TEXT NOT NULL DEFAULT 'index,follow',
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImageId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("ownerType","ownerId","locale")
);

CREATE TABLE "ContactSubmission" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "organization" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "serviceId" TEXT REFERENCES "Service"("id") ON DELETE SET NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "consentJson" JSONB,
  "notificationStatus" TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "retentionUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Redirect" (
  "id" TEXT PRIMARY KEY,
  "fromPath" TEXT NOT NULL UNIQUE,
  "toPath" TEXT NOT NULL,
  "permanent" BOOLEAN NOT NULL DEFAULT true,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PageTranslation_locale_pageId_idx" ON "PageTranslation"("locale","pageId");
CREATE INDEX "PageSection_pageId_sortOrder_idx" ON "PageSection"("pageId","sortOrder");
CREATE INDEX "NavigationItem_menuId_sortOrder_idx" ON "NavigationItem"("menuId","sortOrder");
CREATE INDEX "Service_status_featured_sortOrder_idx" ON "Service"("status","featured","sortOrder");
CREATE INDEX "Project_status_featured_sortOrder_idx" ON "Project"("status","featured","sortOrder");
CREATE INDEX "Client_enabled_featured_sortOrder_idx" ON "Client"("enabled","featured","sortOrder");
CREATE INDEX "MediaUsage_mediaAssetId_isPublishedReference_idx" ON "MediaUsage"("mediaAssetId","isPublishedReference");
CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status","createdAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
