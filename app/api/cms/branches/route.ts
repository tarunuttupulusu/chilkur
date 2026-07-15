import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, logAdminAction } from '@/lib/auth';
import { unstable_cache, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const getCachedBranches = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      include: {
        tables: true
      },
      orderBy: { name: 'asc' }
    });
  },
  ['branches-list'],
  { tags: ['branches'] }
);

// GET /api/cms/branches
export async function GET() {
  try {
    const branches = await getCachedBranches();

    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cms/branches
// Protected (admin only)
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phone, totalTables, openingTime, closingTime } = body;

    if (!name || !address || !phone || totalTables === undefined || !openingTime || !closingTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        totalTables: parseInt(totalTables, 10),
        openingTime,
        closingTime
      }
    });

    // Automatically create tables for the branch
    const tableCreates = [];
    for (let i = 1; i <= parseInt(totalTables, 10); i++) {
      tableCreates.push(
        prisma.table.create({
          data: {
            branchId: branch.id,
            tableNumber: i,
            capacity: i % 2 === 0 ? 4 : 2, // Alternate capacities
            status: 'available'
          }
        })
      );
    }
    await Promise.all(tableCreates);

    revalidateTag('branches');

    await logAdminAction(user.id, user.email, 'CREATE_BRANCH', `Branch: ${branch.name}`, null, branch);

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/cms/branches
// Protected (admin only)
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: 'Missing branch ID or data' }, { status: 400 });
    }

    const oldBranch = await prisma.branch.findUnique({
      where: { id },
      include: { tables: true }
    });

    if (!oldBranch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        totalTables: parseInt(data.totalTables || oldBranch.totalTables, 10),
        openingTime: data.openingTime,
        closingTime: data.closingTime
      }
    });

    // If tables count changed, synchronize tables
    const newCount = parseInt(data.totalTables, 10);
    if (!isNaN(newCount) && newCount !== oldBranch.totalTables) {
      if (newCount > oldBranch.totalTables) {
        // Create additional tables
        const tableCreates = [];
        for (let i = oldBranch.totalTables + 1; i <= newCount; i++) {
          tableCreates.push(
            prisma.table.create({
              data: {
                branchId: branch.id,
                tableNumber: i,
                capacity: i % 2 === 0 ? 4 : 2,
                status: 'available'
              }
            })
          );
        }
        await Promise.all(tableCreates);
      } else {
        // Delete excess tables starting from highest table number
        const excessTables = await prisma.table.findMany({
          where: { branchId: id },
          orderBy: { tableNumber: 'desc' },
          take: oldBranch.totalTables - newCount
        });
        
        const deleteIds = excessTables.map(t => t.id);
        await prisma.table.deleteMany({
          where: { id: { in: deleteIds } }
        });
      }
    }

    revalidateTag('branches');

    await logAdminAction(user.id, user.email, 'UPDATE_BRANCH', `Branch: ${branch.name}`, oldBranch, branch);

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/branches
// Protected (admin only)
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing branch ID' }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    // Cascade delete tables
    await prisma.table.deleteMany({ where: { branchId: id } });
    await prisma.branch.delete({ where: { id } });

    revalidateTag('branches');

    await logAdminAction(user.id, user.email, 'DELETE_BRANCH', `Branch: ${branch.name}`, branch, null);

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
