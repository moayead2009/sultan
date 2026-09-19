# Phase 4 handoff

## Current release state

The implementation branch contains the completed application plus Phase 4 production-readiness tooling. It is prepared for review, not merged and not deployed. Real production credentials, domain/DNS/TLS, object-storage account details, email credentials, external monitoring and backup scheduler configuration are intentionally absent from source control.

## Architecture and stack

The application is Next.js 16/React 19/TypeScript with PostgreSQL/Prisma, private NextAuth credentials authentication, OWNER/ADMIN roles, revocable server sessions, S3-compatible production media storage and optional Resend notification. Architecture details and repository responsibilities are in `docs/architecture.md`.

## Schema and migrations

`prisma/schema.prisma` is authoritative. Apply committed migrations with `npm run db:migrate`/`prisma migrate deploy`; never use migration reset in production. Take a verified backup before production migration. Rollback is application-SHA rollback when schema-compatible, otherwise an explicitly approved restore procedure.

## Auth and permissions

There is no public registration. Bootstrap the first OWNER once with the script documented in `docs/operations.md`, remove the bootstrap password immediately, and use OWNER CMS account management afterward. ADMIN cannot perform OWNER-only account controls.

## Storage, email and environment

Production media requires `STORAGE_DRIVER=s3`; PostgreSQL stores media metadata and references. Resend is optional and inquiries remain persisted if notification fails. Turnstile is optional but its key pair must be complete when enabled. Run `npm run ops:preflight` against the real secret-store environment before every first deployment or material environment change.

## CMS, translation, SEO and redirects

The CMS manages bilingual pages/sections, navigation/footer, services, projects, clients, capabilities, metrics, leadership/contact data, media, SEO, redirects, branding/settings and inquiries. English and Arabic are separately authored and Arabic remains RTL. Publication gates, source-confirmation gates, authenticated preview, canonical/hreflang/x-default metadata, sitemap/robots/structured data and request-boundary redirects must remain enabled.

## Backup, restore and monitoring

`scripts/backup-db.sh` and `scripts/restore-db.sh` provide database primitives; object-storage recovery is a separate required control. The production owner must record the real backup schedule, retention, storage location and operational owner before go-live and complete the isolated restore-test procedure in `docs/operations.md`. External monitoring must check liveness/readiness and the selected infrastructure/provider alerts.

## Security notes

Keep all credentials out of Git. Preserve CSP/HSTS/security headers, same-origin mutation checks, URL validation, Argon2 password handling, revocable sessions, upload validation/re-encoding, rate limiting, Turnstile support, noindex protected surfaces and recursive structured-log redaction. Do not log request bodies or inquiry PII.

## Verification evidence

The approved Phase 3 baseline was `a85164e0991c31629c882eece7ee96f64f81cd1e`, with the complete Phase 1–3 CI green before Phase 4 began. Phase 4 extends that workflow with production-preflight and backup/restore syntax gates, keeps dependency audit/migration/seed/lint/typecheck/unit/integration/E2E/accessibility/responsive/browser/build/performance coverage, and starts the performance server only after `/api/ready` becomes healthy. The final Phase 4 branch must have a fully green CI run before approval.

## Known limitations and owner/infrastructure confirmations

The repository cannot supply real production domain/DNS/TLS settings, PostgreSQL credentials, object-storage vendor credentials/CDN settings, email credentials, monitoring provider/alert destinations, or the infrastructure scheduler/retention policy for backups. Those must be supplied by the production owner without committing secrets.

Business-content confirmation gates also remain intentional: unconfirmed metrics, strategic-client identities/logos, unnamed/unverified project facts, unresolved legal/contact/social details and the unresolved English premium capability-tier name must stay unpublished until the owner confirms them.

## Final acceptance

Review `docs/operations.md`, run the repository CI, verify all stages actually execute and pass, verify no secrets are present in the diff, and confirm the production acceptance gate before merge/deployment. `docs/decisions.md` and `docs/history.md` are part of this handoff and must remain with the repository.
