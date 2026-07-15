'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

// Server Action 1: Create a new Branch
export async function createBranch(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  if (name && phone && address) {
    await prisma.branch.create({
      data: { 
        name, 
        phone, 
        address,
        totalTables: 10,
        openingTime: "11:00",
        closingTime: "23:00"
      }
    });
    (revalidateTag as any)('branches');
    revalidatePath('/admin/settings');
    revalidatePath('/');
  }
}

// Server Action 2: Update an existing Branch
export async function updateBranch(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  if (id && name && phone && address) {
    await prisma.branch.update({
      where: { id },
      data: { name, phone, address }
    });
    (revalidateTag as any)('branches');
    revalidatePath('/admin/settings');
    revalidatePath('/');
  }
}

// Server Action 3: Delete a Branch
export async function deleteBranch(id: string) {
  if (id) {
    const count = await prisma.branch.count();
    if (count <= 1) {
      return;
    }
    
    // Delete child offers, reservations, and tables first to prevent foreign key violations
    await prisma.reservation.deleteMany({ where: { branchId: id } });
    await prisma.table.deleteMany({ where: { branchId: id } });
    await prisma.offer.deleteMany({ where: { branchId: id } });
    
    await prisma.branch.delete({
      where: { id }
    });
    (revalidateTag as any)('branches');
    revalidatePath('/admin/settings');
    revalidatePath('/');
  }
}

// Server Action 4: Update Campaign Badge settings
export async function updateCampaignSettings(formData: FormData) {
  const badgeText = formData.get('bookingBadgeText') as string;
  const badgeActive = formData.get('bookingBadgeActive') === 'on';
  const badgeColor = formData.get('bookingBadgeColor') as string;

  await prisma.siteSettings.upsert({
    where: { key: 'website_settings' },
    update: {
      value: JSON.stringify({
        bookingBadgeText: badgeText || 'Special Offer',
        bookingBadgeActive: badgeActive,
        bookingBadgeColor: badgeColor || '#D35400'
      })
    },
    create: {
      key: 'website_settings',
      value: JSON.stringify({
        bookingBadgeText: badgeText || 'Special Offer',
        bookingBadgeActive: badgeActive,
        bookingBadgeColor: badgeColor || '#D35400'
      })
    }
  });

  revalidatePath('/admin/settings');
  revalidatePath('/');
}
