import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag as originalRevalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';

const revalidateTag = (tag: string) => {
  try {
    (originalRevalidateTag as any)(tag);
  } catch (e) {
    console.error('revalidateTag error:', e);
  }
};

// GET /api/cms/menu
// Fetches all categories and dishes, with optional search, filtering, and pagination.
export async function GET(request: Request) {
  // Headers that prevent ALL caching layers (Vercel Edge, CDN, browser) from caching this response.
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryName = searchParams.get('category') || '';
    const recommendedOnly = searchParams.get('recommended') === 'true';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10);
    const includeHidden = searchParams.get('includeHidden') === 'true';

    // Verify session if trying to see hidden items
    let canSeeHidden = false;
    if (includeHidden) {
      const user = await getSessionUser();
      if (user) canSeeHidden = true;
    }

    // Build query filters
    const dishWhere: any = {};
    
    if (!canSeeHidden) {
      dishWhere.isHidden = false;
    }
    
    if (search) {
      dishWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { teluguName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (recommendedOnly) {
      dishWhere.isRecommended = true;
    }

    if (categoryName) {
      dishWhere.category = {
        name: categoryName
      };
    }

    // If request asks for pagination (e.g. page > 0 and limit > 0)
    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      const [dishes, total] = await Promise.all([
        prisma.dish.findMany({
          where: dishWhere,
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          include: { category: true },
          skip,
          take: limit,
        }),
        prisma.dish.count({ where: dishWhere }),
      ]);

      return NextResponse.json({
        success: true,
        dishes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }, { headers: noCacheHeaders });
    }

    // Default: return categories grouped with their dishes
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        dishes: {
          where: !canSeeHidden ? { isHidden: false } : undefined,
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({ success: true, categories }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: noCacheHeaders });
  }
}


// POST /api/cms/menu
// Creates a new Dish or Category. Protected (admin/staff only).
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Missing type or data' }, { status: 400 });
    }

    if (type === 'category') {
      if (!data.name) {
        return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
      }

      // Check duplicate
      const existing = await prisma.category.findUnique({ where: { name: data.name } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Category already exists' }, { status: 400 });
      }

      const category = await prisma.category.create({
        data: {
          name: data.name,
          teluguName: data.teluguName || null,
          description: data.description || null,
          order: data.order ?? 0
        }
      });

      await logAdminAction(user.id, user.email, 'CREATE_CATEGORY', `Category: ${category.name}`, null, category);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, category });
    } 
    
    if (type === 'dish') {
      // Note: price can be 0, so use explicit null check (not !data.price which would reject 0)
      if (!data.name || data.price === undefined || data.price === null || !data.categoryId || !data.image) {
        return NextResponse.json({ success: false, error: 'Missing required dish fields (name, price, categoryId, image)' }, { status: 400 });
      }

      const dish = await prisma.dish.create({
        data: {
          name: data.name,
          teluguName: data.teluguName || null,
          description: data.description || null,
          price: data.price,
          image: data.image,
          categoryId: data.categoryId,
          isVegetarian: data.isVegetarian ?? true,
          isBestseller: data.isBestseller ?? false,
          isChefSpecial: data.isChefSpecial ?? false,
          isSeasonal: data.isSeasonal ?? false,
          isOutOfStock: data.isOutOfStock ?? false,
          isHidden: data.isHidden ?? false,
          rating: data.rating ?? 4.5,
          order: data.order ?? 0,
          images: data.images || null,
          scheduleDays: data.scheduleDays || null,
          scheduleTimings: data.scheduleTimings || null,
          isRecommended: data.isRecommended ?? false,
          lastModifiedBy: user.email
        }
      });

      await logAdminAction(user.id, user.email, 'CREATE_DISH', `Dish: ${dish.name}`, null, dish);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, dish });
    }

    return NextResponse.json({ success: false, error: 'Invalid type. Use "category" or "dish".' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/menu
// Updates an existing Dish or Category. Protected.
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return NextResponse.json({ success: false, error: 'Missing type, id, or data' }, { status: 400 });
    }

    if (type === 'category') {
      const oldVal = await prisma.category.findUnique({ where: { id } });
      if (!oldVal) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          teluguName: data.teluguName,
          description: data.description,
          order: data.order
        }
      });

      await logAdminAction(user.id, user.email, 'UPDATE_CATEGORY', `Category: ${category.name}`, oldVal, category);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, category });
    }

    if (type === 'dish') {
      const oldVal = await prisma.dish.findUnique({ where: { id } });
      if (!oldVal) {
        return NextResponse.json({ success: false, error: 'Dish not found' }, { status: 404 });
      }

      const dish = await prisma.dish.update({
        where: { id },
        data: {
          name: data.name,
          teluguName: data.teluguName,
          description: data.description,
          price: data.price,
          image: data.image,
          categoryId: data.categoryId,
          isVegetarian: data.isVegetarian,
          isBestseller: data.isBestseller,
          isChefSpecial: data.isChefSpecial,
          isSeasonal: data.isSeasonal,
          isOutOfStock: data.isOutOfStock,
          isHidden: data.isHidden,
          rating: data.rating,
          order: data.order,
          images: data.images,
          scheduleDays: data.scheduleDays,
          scheduleTimings: data.scheduleTimings,
          isRecommended: data.isRecommended,
          lastModifiedBy: user.email
        }
      });

      await logAdminAction(user.id, user.email, 'UPDATE_DISH', `Dish: ${dish.name}`, oldVal, dish);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, dish });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/menu
// Deletes a Dish or Category. Protected.
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Missing type or id parameter' }, { status: 400 });
    }

    if (type === 'category') {
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
      }

      await prisma.category.delete({ where: { id } });

      await logAdminAction(user.id, user.email, 'DELETE_CATEGORY', `Category: ${category.name}`, category, null);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    }

    if (type === 'dish') {
      const dish = await prisma.dish.findUnique({ where: { id } });
      if (!dish) {
        return NextResponse.json({ success: false, error: 'Dish not found' }, { status: 404 });
      }

      await prisma.dish.delete({ where: { id } });

      await logAdminAction(user.id, user.email, 'DELETE_DISH', `Dish: ${dish.name}`, dish, null);
      await Promise.all([
        revalidatePath('/menu'),
        revalidatePath('/'),
        revalidateTag('menu-items')
      ]);

      return NextResponse.json({ success: true, message: 'Dish deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
