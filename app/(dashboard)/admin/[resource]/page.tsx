import { notFound } from 'next/navigation';

export default async function UnsupportedDynamicAdminResource({ params }: { params: Promise<{ resource: string }> }) {
  await params;
  notFound();
}
