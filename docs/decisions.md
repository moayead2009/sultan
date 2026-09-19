# Implementation decisions

This log records implementation decisions that extend or instantiate the approved V2 package. It does not replace the V2 package.

## D-001 — ORM implementation

Decision: Prisma is used for the approved PostgreSQL relational model and migration workflow.

Reason: It provides typed relations, migration tooling, parameterized queries and a maintainable fit with the approved Next.js/TypeScript architecture.

## D-002 — Authentication implementation

Decision: NextAuth/Auth.js v4 Credentials provider with Argon2 password hashing is used for the private OWNER/ADMIN CMS.

Reason: This satisfies the approved requirement to use a maintained authentication library rather than homemade session/auth code while retaining the V2 role and bootstrap model.

## D-003 — Object storage adapter

Decision: Media is accessed through a storage adapter supporting local development storage and S3-compatible production storage.

Reason: This directly implements the V2 storage abstraction and keeps production vendor choice configurable.

## D-004 — Brand colors before owner confirmation

Decision: Observed purple/gold/turquoise cues are represented as semantic CSS variables and remain replaceable. They are not recorded as owner-confirmed official color codes.

Reason: V2 permits implementation to continue while exact official color codes remain an owner-confirmation item.


## D-005 — Revocable CMS sessions

Decision: NextAuth remains the maintained authentication/session library, while each JWT-backed login is bound to a server-side AuthSession record that can be revoked.

Reason: This preserves the approved maintained-library authentication architecture while allowing account disablement, password changes/resets and logout to invalidate existing sessions immediately on the server.

## D-006 — Supported Next.js release line

Decision: The Phase 1 App Router foundation targets Next.js 16.x Active LTS rather than the unsupported 14.x line.

Reason: The V2 architecture requires Next.js App Router, not a specific obsolete major. Moving to Active LTS preserves the approved architecture while restoring supported security and maintenance status.

## D-007 — Database-backed redirects at the request boundary

Decision: Enabled Redirect CMS records are resolved by the Next.js request proxy before public route handling; admin, preview and API routes are excluded.

Reason: Redirect records must be operational rather than passive CMS data, while protected and preview surfaces must not be unexpectedly redirected by public content configuration.
