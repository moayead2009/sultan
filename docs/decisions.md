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
