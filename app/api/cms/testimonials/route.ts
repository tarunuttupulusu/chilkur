import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';
import { unstable_cache, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const getCachedTestimonials = unstable_cache(
  async (approvedOnly: boolean) => {
    const where: any = {};
    if (approvedOnly) {
      where.isApproved = true;
    }
    return prisma.testimonial.findMany({
      where,
      orderBy: { order: 'asc' }
    });
  },
  ['testimonials-list'],
  { tags: ['testimonials'] }
);

// GET /api/cms/testimonials
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get('approvedOnly') === 'true';

    const testimonials = await getCachedTestimonials(approvedOnly);

    return NextResponse.json({ success: true, testimonials });
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cms/testimonials
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || !body.content || !body.rating) {
      return NextResponse.json({ success: false, error: 'Missing name, content, or rating' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name,
        role: body.role || 'Customer',
        content: body.content,
        rating: parseInt(body.rating, 10) || 5,
        source: body.source || 'Direct Submission',
        avatar: body.avatar || null,
        date: body.date || 'Just now',
        isApproved: body.isApproved ?? true,
        order: body.order ?? 0
      }
    });

    revalidateTag('testimonials');

    await logAdminAction(user.id, user.email, 'CREATE_TESTIMONIAL', `Testimonial by: ${testimonial.name}`, null, testimonial);

    return NextResponse.json({ success: true, testimonial });
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/testimonials
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID or data' }, { status: 400 });
    }

    const oldVal = await prisma.testimonial.findUnique({ where: { id } });
    if (!oldVal) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        content: data.content,
        rating: parseInt(data.rating, 10),
        source: data.source,
        avatar: data.avatar,
        date: data.date,
        isApproved: data.isApproved,
        order: data.order
      }
    });

    revalidateTag('testimonials');

    await logAdminAction(user.id, user.email, 'UPDATE_TESTIMONIAL', `Testimonial: ${testimonial.name}`, oldVal, testimonial);

    return NextResponse.json({ success: true, testimonial });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/testimonials
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing testimonial ID' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });

    revalidateTag('testimonials');

    await logAdminAction(user.id, user.email, 'DELETE_TESTIMONIAL', `Testimonial: ${testimonial.name}`, testimonial, null);

    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
