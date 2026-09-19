import { z } from 'zod';

const empty = z.object({}).strict();
const alignment = z.enum(['start', 'center', 'end']);
const mediaPosition = z.enum(['start', 'end', 'background']);

export const sectionSchemas = {
  hero: z
    .object({
      overlay: z.number().min(0).max(100).default(35),
      textAlign: alignment.default('start'),
      mediaPosition: mediaPosition.default('background')
    })
    .strict(),
  intro: z
    .object({
      layout: z.enum(['split', 'stacked']).default('split'),
      mediaPosition: z.enum(['start', 'end']).default('end')
    })
    .strict(),
  metrics: z.object({ maxItems: z.number().int().min(1).max(4).default(4) }).strict(),
  featuredServices: z.object({ maxItems: z.number().int().min(1).max(6).default(6) }).strict(),
  workCycle: z
    .object({
      layout: z.enum(['desktop-horizontal', 'tablet-grid', 'mobile-timeline']).default('desktop-horizontal')
    })
    .strict(),
  featuredProjects: z.object({ maxItems: z.number().int().min(1).max(8).default(4) }).strict(),
  technologyFeature: z
    .object({
      mediaPosition: z.enum(['start', 'end']).default('start'),
      themeVariant: z.enum(['light', 'dark']).default('dark')
    })
    .strict(),
  clients: z.object({ maxItems: z.number().int().min(1).max(30).default(12) }).strict(),
  cta: z
    .object({
      alignment: alignment.default('center'),
      themeVariant: z.enum(['light', 'purple', 'dark']).default('purple')
    })
    .strict(),
  richText: z
    .object({
      maxWidth: z.enum(['prose', 'wide']).default('prose'),
      themeVariant: z.enum(['light', 'muted']).default('light')
    })
    .strict(),
  gallery: z
    .object({
      columns: z.number().int().min(1).max(4).default(3),
      aspectRatio: z.enum(['square', 'landscape', 'portrait', 'auto']).default('landscape'),
      lightbox: z.boolean().default(true)
    })
    .strict(),
  leadership: z.object({ maxItems: z.number().int().min(1).max(8).default(1) }).strict(),
  capabilityComparison: z
    .object({
      mobileMode: z.enum(['stacked', 'scroll']).default('stacked'),
      showLegend: z.boolean().default(false)
    })
    .strict(),
  serviceIndex: z.object({ grouping: z.enum(['category', 'flat']).default('category') }).strict(),
  projectIndex: z
    .object({
      columns: z.number().int().min(1).max(4).default(3),
      filterMode: z.enum(['category', 'none']).default('category')
    })
    .strict(),
  contactDetails: z.object({ layout: z.enum(['cards', 'split']).default('cards') }).strict(),
  contactForm: z.object({ formVariant: z.enum(['base', 'rfp']).default('base') }).strict()
} as const;

export type SectionType = keyof typeof sectionSchemas;

export function parseSectionSettings(type: string, version: number, settings: unknown) {
  if (version !== 1) throw new Error('Unsupported section settings version.');
  const schema = sectionSchemas[type as SectionType];
  if (!schema) throw new Error('Unknown section type.');
  return schema.parse(settings ?? {});
}

export const allowedSections = {
  home: ['hero', 'metrics', 'intro', 'featuredServices', 'workCycle', 'featuredProjects', 'technologyFeature', 'clients', 'cta'],
  about: ['hero', 'intro', 'richText', 'workCycle', 'metrics', 'leadership', 'cta'],
  services: ['hero', 'intro', 'serviceIndex', 'technologyFeature', 'workCycle', 'cta'],
  service: ['hero', 'intro', 'richText', 'gallery', 'featuredProjects', 'cta'],
  projects: ['hero', 'projectIndex', 'cta'],
  project: ['hero', 'intro', 'richText', 'gallery', 'cta'],
  capabilities: ['hero', 'intro', 'capabilityComparison', 'cta'],
  clients: ['hero', 'intro', 'clients', 'cta'],
  contact: ['hero', 'contactDetails', 'contactForm']
} as const;

export function assertSectionAllowed(template: keyof typeof allowedSections, type: string) {
  if (!allowedSections[template].includes(type as never)) {
    throw new Error('Section type is not allowed on this page template.');
  }
}
