'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, optionalText } from '@/lib/admin-input';

const text = z.string().trim().min(1).max(500);

export async function createContactPerson(formData: FormData) {
  await requireAdmin();
  const person = await db.contactPerson.create({
    data: {
      phone: optionalText(formData.get('phone')),
      email: optionalText(formData.get('email')),
      organization: optionalText(formData.get('organization')),
      enabled: checkbox(formData.get('enabled')),
      translations: { create: [
        { locale: 'en', name: text.parse(formData.get('enName')), title: optionalText(formData.get('enTitle')) },
        { locale: 'ar', name: text.parse(formData.get('arName')), title: optionalText(formData.get('arTitle')) }
      ] }
    }
  });
  await auditAdmin('CREATE', 'ContactPerson', person.id);
  revalidatePath('/admin/contact-people');
}
