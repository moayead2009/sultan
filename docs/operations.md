# Production operations runbook

This runbook prepares Phase 4 for a real production environment without inventing domains, credentials, vendors or infrastructure that are not present in the repository. Deployment is intentionally not performed by this phase.

## Production dependencies

A production release requires Node.js 24 LTS (24.x), PostgreSQL 16+, durable S3-compatible object storage with an HTTPS public media URL, and an HTTPS reverse proxy/platform endpoint for the application. Resend, Cloudflare Turnstile and an external error-monitoring service are optional integrations and must only be enabled when their real credentials are available.

Production secrets belong in the deployment platform's secret store. Never commit `.env`, database credentials, `AUTH_SECRET`, object-storage credentials, email API keys, Turnstile secrets, monitoring DSNs or the one-time OWNER password.

## Environment checklist

Start from `.env.example`, then set the actual production values in the platform. `npm run ops:preflight` verifies the production contract without printing secret values. It requires a PostgreSQL URL, a strong non-placeholder auth secret, matching HTTPS `APP_URL`/`NEXTAUTH_URL`, `STORAGE_DRIVER=s3`, object-storage bucket and HTTPS public URL, paired static storage credentials when used, paired Turnstile keys when enabled, and complete Resend values when `MAIL_PROVIDER=resend`.

The object-storage endpoint and authentication method remain vendor-specific. Static access/secret keys are optional because a platform may provide workload/instance credentials. The public object-storage URL must be HTTPS.

## Build and migration sequence

Use an immutable reviewed commit SHA as the release source. The application declares Node `>=24.0.0 <25`; production and CI must remain on Node 24.x so dependency engine requirements are enforced consistently. The deployment operator should run, in order:

```bash
npm ci
npm audit --audit-level=high
npm run db:generate
npm run ops:preflight
npm run ops:backup-db
npm run db:migrate
npm run build
npm run start
```

Do not run `prisma migrate reset` in production. That command exists only in CI to prove a fresh schema. Do not seed production as a routine deployment action: seeded source content is for initialization/review and could overwrite intentionally managed content depending on future seed behavior.

After the process starts, require HTTP 200 from `/api/health` and `/api/ready`, then smoke-check `/ar`, `/en`, `/admin/login`, `/robots.txt` and `/sitemap.xml`. Verify one authenticated CMS login and read-only page load before switching traffic. Do not create a real inquiry merely as a smoke test unless the owner explicitly wants that production record.

## First OWNER bootstrap

After migrations and before general CMS access, set `OWNER_NAME`, `OWNER_EMAIL` and a unique strong `OWNER_PASSWORD` only for the bootstrap command:

```bash
OWNER_NAME='...' OWNER_EMAIL='...' OWNER_PASSWORD='...' npm run bootstrap:owner
```

The command upserts that email as an active OWNER. Immediately remove the bootstrap password from shell history, CI variables and deployment environment after successful use. Subsequent user/account management belongs in the OWNER CMS.

## Database backups

`npm run ops:backup-db` uses `pg_dump` custom format with restrictive file permissions and never prints the database URL. `BACKUP_DIR` selects the destination. `BACKUP_RETENTION_DAYS`, when explicitly configured, prunes older matching dumps; there is deliberately no silent retention default because backup retention and storage ownership are infrastructure/owner decisions that must be recorded before go-live.

The infrastructure owner must schedule the backup command outside the web process at the approved operational frequency, send backups to durable storage separate from the application host, encrypt them according to provider controls, and monitor backup success. The final production handoff must record the chosen schedule, retention and responsible owner.

## Media backup strategy

Database dumps do not contain media bytes. Enable the chosen object-storage provider's versioning/snapshot/replication capability or equivalent durable backup control before go-live. Retain enough history to recover accidental media deletion together with the matching database point in time. Do not copy storage access keys into backup logs or documentation.

## Restore and restore testing

`npm run ops:restore-db -- /path/to/backup.dump` is intentionally blocked unless `CONFIRM_RESTORE=YES` is set. It uses `pg_restore --clean --if-exists --exit-on-error`, so the operator must verify the target database before running it.

Restore tests must use an isolated/disposable PostgreSQL database: create the test database, point `DATABASE_URL` at it, restore a selected dump, run `npm run db:generate`, start the application against the restored database, verify `/api/ready`, authenticate to the CMS and sample bilingual public content/media references. Verify the associated object-storage recovery separately. Record the date, backup identifier, operator and result in the organization's operational record. Never test a destructive restore against production.

## Monitoring and logging

`/api/health` is the liveness check and has no dependency work. `/api/ready` checks PostgreSQL and required storage configuration; it returns only `ready` or `unavailable`. Configure the external platform/monitor to alert when readiness fails or the application is unreachable. Keep the monitor independent of the application host where possible.

Application logs are structured JSON on stdout/stderr. Common secret and PII metadata keys are recursively redacted. Logging call sites must use identifiers/reason codes rather than inquiry bodies, passwords, tokens, email addresses or phone numbers. Do not send raw request bodies or environment objects to logs. If an external error-monitoring provider is enabled, configure server-side scrubbing there as a second control.

Operational monitoring should cover application availability/readiness, HTTP 5xx rate, deployment failures, database capacity/connectivity, object-storage availability, backup job success, TLS/domain expiry and external email delivery failures when email is enabled. The actual provider and alert destinations remain deployment decisions.

## Rollback

Record the previous application SHA and the pre-migration database backup before each release. If a new application release fails but the migrated schema remains backward-compatible, switch the application back to the previous reviewed SHA and re-run health/readiness/smoke checks. Do not attempt automatic Prisma down-migrations.

If the schema change is not backward-compatible, treat rollback as a coordinated data restore: remove traffic, preserve the failed database for diagnosis, restore the verified pre-migration database backup to the intended target, restore/match object-storage state if the release changed media, start the previous application SHA, then run readiness, authentication and bilingual public smoke checks before returning traffic. A database restore can discard post-backup writes, so it requires explicit incident approval.

## Production acceptance gate

Do not go live until the branch CI is fully green; the real domain and TLS are active; production database/storage are durable; production secrets pass preflight; the first OWNER is provisioned securely; backups are scheduled and a restore test is recorded; external monitoring/alerts are active; email and Turnstile are either deliberately configured or deliberately disabled; `/api/health` and `/api/ready` pass; English/Arabic/RTL smoke checks pass; and unresolved owner-confirmation content remains unpublished.

Merge and deployment are separate owner approvals and are not performed by this Phase 4 implementation.
