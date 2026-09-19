# Solutions Gate Website

Bilingual English/Arabic corporate website and structured CMS for Solutions Gate, implemented from the approved V2 planning package.

## Local prerequisites

- Node.js 20
- PostgreSQL 16+
- npm

Copy .env.example to .env, set a local DATABASE_URL and a long AUTH_SECRET, then run npm install, npm run db:generate, npm run db:migrate, npm run db:seed, bootstrap the first owner with OWNER_NAME / OWNER_EMAIL / OWNER_PASSWORD and npm run bootstrap:owner, then npm run dev.

The deterministic site root uses SiteSettings.defaultLocale, with Arabic as the planning default. CMS routes are under /admin. There is no public registration.

## Safety of source-derived content

Unconfirmed metrics, clients, legal copy, contact email/address/social accounts, the unresolved English premium capability tier name and contact-form policy fields remain gated or unpublished. Do not publish them without owner confirmation.

See docs/ for architecture, operations, section contracts, history and decisions.
