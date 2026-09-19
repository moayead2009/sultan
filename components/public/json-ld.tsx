import { serializeStructuredData, type StructuredDataValue } from '@/lib/structured-data';

export function JsonLd({ data }: { data: StructuredDataValue }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}
