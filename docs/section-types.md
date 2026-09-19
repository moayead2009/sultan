# Section type contracts

The CMS is a constrained structured editor, not an unrestricted page builder. Every PageSection has a known sectionType, settingsVersion, relational content/media references, separately authored English/Arabic copy, ordering and enabled state.

Version 1 types are: hero, intro, metrics, featuredServices, workCycle, featuredProjects, technologyFeature, clients, cta, richText, gallery, leadership, capabilityComparison, serviceIndex, projectIndex, contactDetails, and contactForm.

Settings are validated by strict Zod schemas in lib/section-schemas.ts. Unknown settings keys and unknown schema versions are rejected. Arbitrary model IDs are not permitted inside settings JSON; relationships belong in relational tables such as PageSectionMedia, ProjectService and domain models.

Rich text is content-only and must be rendered through the constrained renderer. Raw arbitrary HTML is not accepted as CMS input.
