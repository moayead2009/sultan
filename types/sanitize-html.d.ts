declare module 'sanitize-html' {
  type Options = { allowedTags?: string[]; allowedAttributes?: Record<string, string[]> };
  export default function sanitizeHtml(html: string, options?: Options): string;
}
