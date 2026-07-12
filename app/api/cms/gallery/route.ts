import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

// Headers that prevent ALL caching layers (Vercel Edge, CDN, browser) from caching this response.
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// GET /api/cms/gallery
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isFeatured = searchParams.get('featured') === 'true';
    const albumName = searchParams.get('album') || '';

    const where: any = {};
    if (isFeatured) {
      where.isFeatured = true;
    }
    if (albumName) {
      where.albumName = albumName;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { menuDishName: { contains: search, mode: 'insensitive' } },
        { menuCategory: { contains: search, mode: 'insensitive' } },
      ];
    }

    const photos = await prisma.galleryPhoto.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    // Also get all unique albums for filter UI
    const albums = await prisma.galleryPhoto.findMany({
      select: { albumName: true },
      distinct: ['albumName'],
    });

    return NextResponse.json({ 
      success: true, 
      photos, 
      albums: albums.map(a => a.albumName)
    }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: noCacheHeaders });
  }
}

// POST /api/cms/gallery
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.src || !body.title) {
      return NextResponse.json({ success: false, error: 'Missing source URL or title' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        src: body.src,
        title: body.title,
        menuCategory: body.menuCategory || null,
        menuDishName: body.menuDishName || null,
        order: body.order ?? 0,
        altText: body.altText || body.title,
        isFeatured: body.isFeatured ?? false,
        albumName: body.albumName || 'General',
      }
    });

    await logAdminAction(user.id, user.email, 'ADD_GALLERY_PHOTO', `Photo: ${photo.title}`, null, photo);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), revalidateTag('gallery')]);

    return NextResponse.json({ success: true, photo }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error creating gallery photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/gallery
// Supports single updates AND bulk update (for reordering).
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if bulk reorder
    if (body.bulk && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: string; order: number }) =>
        prisma.galleryPhoto.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      );
      
      await Promise.all(updates);
      await logAdminAction(user.id, user.email, 'REORDER_GALLERY', `Reordered ${updates.length} items`, null, null);
      await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), revalidateTag('gallery')]);
      
      return NextResponse.json({ success: true, message: 'Reordered successfully' }, { headers: noCacheHeaders });
    }

    // Normal update
    const { id, data } = body;
    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing photo ID or update data' }, { status: 400 });
    }

    const oldVal = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!oldVal) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    const photo = await prisma.galleryPhoto.update({
      where: { id },
      data: {
        src: data.src,
        title: data.title,
        menuCategory: data.menuCategory,
        menuDishName: data.menuDishName,
        order: data.order,
        altText: data.altText,
        isFeatured: data.isFeatured,
        albumName: data.albumName,
      }
    });

    await logAdminAction(user.id, user.email, 'UPDATE_GALLERY_PHOTO', `Photo: ${photo.title}`, oldVal, photo);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), revalidateTag('gallery')]);

    return NextResponse.json({ success: true, photo }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error updating gallery:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/gallery
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing photo ID' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    await prisma.galleryPhoto.delete({ where: { id } });

    await logAdminAction(user.id, user.email, 'DELETE_GALLERY_PHOTO', `Photo: ${photo.title}`, photo, null);
    await Promise.all([revalidatePath('/gallery'), revalidatePath('/'), revalidateTag('gallery')]);

    return NextResponse.json({ success: true, message: 'Photo deleted successfully' }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error deleting gallery photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
