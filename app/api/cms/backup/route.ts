import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

// GET /api/cms/backup
// Generates full database backup payload
// Protected (admin only)
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const typesParam = searchParams.get('types');
    const selectedTypes = typesParam ? typesParam.split(',') : [];

    const backupData: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
    };

    const exportAll = selectedTypes.length === 0;

    if (exportAll || selectedTypes.includes('branches')) {
      backupData.branches = await prisma.branch.findMany();
    }
    if (exportAll || selectedTypes.includes('menu')) {
      backupData.categories = await prisma.category.findMany();
      backupData.dishes = await prisma.dish.findMany();
    }
    if (exportAll || selectedTypes.includes('reviews')) {
      backupData.testimonials = await prisma.testimonial.findMany();
    }
    if (exportAll || selectedTypes.includes('gallery')) {
      backupData.galleryPhotos = await prisma.galleryPhoto.findMany();
    }
    if (exportAll || selectedTypes.includes('offers')) {
      backupData.offers = await prisma.offer.findMany();
    }
    if (exportAll || selectedTypes.includes('settings')) {
      backupData.settings = await prisma.siteSettings.findMany();
    }
    if (exportAll || selectedTypes.includes('orders')) {
      backupData.whatsappOrders = await prisma.whatsAppOrder.findMany();
    }
    if (exportAll || selectedTypes.includes('reservations')) {
      backupData.reservations = await prisma.reservation.findMany();
    }
    if (exportAll || selectedTypes.includes('messages')) {
      backupData.contactMessages = await prisma.contactMessage.findMany();
    }

    await logAdminAction(
      user.id,
      user.email,
      'BACKUP_DATABASE',
      `Database Backup Exported: ${selectedTypes.join(', ') || 'All'}`,
      null,
      null
    );

    return NextResponse.json({ success: true, payload: backupData });
  } catch (error: any) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cms/backup
// Restores database from a JSON backup payload
// Protected (admin only)
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    
    if (body.action === 'seed_reset') {
      const { execSync } = require('child_process');
      try {
        execSync('npx tsx prisma/seed-cms.ts', { cwd: process.cwd(), shell: true });
        await logAdminAction(user.id, user.email, 'SEED_RESET_DATABASE', 'Database Re-seeded to Factory Defaults', null, null);
        return NextResponse.json({ success: true, message: 'Database successfully seeded' });
      } catch (execErr: any) {
        console.error('Seeding exec error:', execErr);
        // Fallback: try npx ts-node if tsx is not present
        execSync('npx ts-node prisma/seed-cms.ts', { cwd: process.cwd(), shell: true });
        await logAdminAction(user.id, user.email, 'SEED_RESET_DATABASE', 'Database Re-seeded to Factory Defaults', null, null);
        return NextResponse.json({ success: true, message: 'Database successfully seeded' });
      }
    }
    
    const backup = body.payload || body;
    
    if (!backup.categories || !backup.dishes) {
      return NextResponse.json({ success: false, error: 'Invalid backup format. Missing core datasets.' }, { status: 400 });
    }

    console.log('⏳ Restoring from database backup...');

    // Perform database restore inside a transaction or sequential steps
    // To preserve integrity, delete current records first and recreate
    await prisma.$transaction([
      // Delete existing
      prisma.offer.deleteMany(),
      prisma.testimonial.deleteMany(),
      prisma.galleryPhoto.deleteMany(),
      prisma.dish.deleteMany(),
      prisma.category.deleteMany(),
    ]);

    // 1. Restore Categories
    if (Array.isArray(backup.categories)) {
      await prisma.category.createMany({
        data: backup.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          teluguName: c.teluguName,
          description: c.description,
          order: c.order ?? 0
        }))
      });
    }

    // 2. Restore Dishes
    if (Array.isArray(backup.dishes)) {
      await prisma.dish.createMany({
        data: backup.dishes.map((d: any) => ({
          id: d.id,
          name: d.name,
          teluguName: d.teluguName,
          description: d.description,
          price: d.price,
          image: d.image,
          categoryId: d.categoryId,
          isVegetarian: d.isVegetarian ?? true,
          isBestseller: d.isBestseller ?? false,
          isChefSpecial: d.isChefSpecial ?? false,
          isSeasonal: d.isSeasonal ?? false,
          isOutOfStock: d.isOutOfStock ?? false,
          isHidden: d.isHidden ?? false,
          rating: d.rating ?? 4.5,
          order: d.order ?? 0,
          images: d.images || null,
          scheduleDays: d.scheduleDays || null,
          scheduleTimings: d.scheduleTimings || null,
          isRecommended: d.isRecommended ?? false,
          lastModifiedBy: d.lastModifiedBy || user.email
        }))
      });
    }

    // 3. Restore Gallery Photos
    if (Array.isArray(backup.galleryPhotos)) {
      await prisma.galleryPhoto.createMany({
        data: backup.galleryPhotos.map((p: any) => ({
          id: p.id,
          src: p.src,
          title: p.title,
          menuCategory: p.menuCategory,
          menuDishName: p.menuDishName,
          order: p.order ?? 0,
          altText: p.altText,
          isFeatured: p.isFeatured ?? false,
          albumName: p.albumName || 'General'
        }))
      });
    }

    // 4. Restore Testimonials
    if (Array.isArray(backup.testimonials)) {
      await prisma.testimonial.createMany({
        data: backup.testimonials.map((t: any) => ({
          id: t.id,
          name: t.name,
          role: t.role,
          content: t.content,
          rating: t.rating ?? 5,
          source: t.source || 'Direct Submission',
          avatar: t.avatar,
          date: t.date,
          isApproved: t.isApproved ?? true,
          order: t.order ?? 0
        }))
      });
    }

    // 5. Restore Offers
    if (Array.isArray(backup.offers)) {
      await prisma.offer.createMany({
        data: backup.offers.map((o: any) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          price: o.price,
          image: o.image,
          badge: o.badge,
          cta: o.cta,
          link: o.link,
          isActive: o.isActive ?? true,
          startDate: o.startDate ? new Date(o.startDate) : null,
          endDate: o.endDate ? new Date(o.endDate) : null,
          showOnHomepage: o.showOnHomepage ?? true,
          displayPriority: o.displayPriority ?? 0,
          branchId: o.branchId
        }))
      });
    }

    // 6. Restore Settings
    if (Array.isArray(backup.settings)) {
      for (const s of backup.settings) {
        await prisma.siteSettings.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value }
        });
      }
    }

    await logAdminAction(user.id, user.email, 'RESTORE_DATABASE', 'Full Database Restore Completed', null, null);

    return NextResponse.json({ success: true, message: 'Database restored successfully' });
  } catch (error: any) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
