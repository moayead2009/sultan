import { describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({
    user: {
      id: 'phase2-owner',
      name: 'Phase 2 Owner',
      email: 'owner@example.invalid',
      role: 'OWNER',
      status: 'ACTIVE'
    }
  }))
}));

vi.mock('@/lib/authorization', () => ({
  requireAdmin: auth.requireAdmin,
  canManageUsers: (role: string) => role === 'OWNER',
  canHardDelete: (role: string) => role === 'OWNER'
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { saveClient, saveMetric } from '@/app/(dashboard)/admin/actions/content';
import { saveCapabilityPackage } from '@/app/(dashboard)/admin/actions/capabilities-inquiries-seo';

describe('Phase 2 business publication gates', () => {
  it('blocks a public client until identity and display approval are both confirmed', async () => {
    const form = new FormData();
    form.set('enName', 'Test Client');
    form.set('arName', 'عميل تجريبي');
    form.set('enAlt', 'Test client logo');
    form.set('arAlt', 'شعار العميل التجريبي');
    form.set('sortOrder', '0');
    form.set('enabled', 'on');

    await expect(saveClient(form)).rejects.toThrow(/identityConfirmed|publicDisplayApproved/);
    expect(auth.requireAdmin).toHaveBeenCalled();
  });

  it('blocks an enabled metric until currentness is confirmed', async () => {
    const form = new FormData();
    form.set('displayValue', '150+');
    form.set('sourceNote', 'Source claim awaiting reconfirmation');
    form.set('enLabel', 'Projects');
    form.set('arLabel', 'المشاريع');
    form.set('sortOrder', '0');
    form.set('enabled', 'on');

    await expect(saveMetric(form)).rejects.toThrow(/lastConfirmedAt/);
  });

  it('blocks an unresolved capability package from public enablement', async () => {
    const form = new FormData();
    form.set('key', 'unresolved-test');
    form.set('enName', 'Owner confirmation required');
    form.set('arName', 'يتطلب تأكيد المالك');
    form.set('sortOrder', '0');
    form.set('enabled', 'on');
    form.set('needsOwnerLabel', 'on');

    await expect(saveCapabilityPackage(form)).rejects.toThrow(/englishPremiumTierLabel/);
  });
});
