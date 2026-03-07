import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: any) {
    try {
        // Next.js 15+ needs await params
        const id = (await context.params).id;
        const { name, parentId, managerId, sort } = await request.json();

        const dept = await prisma.dept.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null,
                managerId: managerId || null,
                sort: Number(sort) || 0
            }
        });

        return NextResponse.json({ code: 200, data: dept, message: '更新成功' });
    } catch (error) {
        console.error('Dept Update Error:', error);
        return NextResponse.json({ code: 500, message: '更新失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const id = (await context.params).id;

        // Check if it has children
        const childrenCount = await prisma.dept.count({
            where: { parentId: id }
        });

        if (childrenCount > 0) {
            return NextResponse.json({ code: 400, message: '该部门下存在子部门，不允许删除' }, { status: 400 });
        }

        // Check if it has users
        const usersCount = await prisma.user.count({
            where: { deptId: id }
        });

        if (usersCount > 0) {
            return NextResponse.json({ code: 400, message: '该部门下存在用户，不允许删除' }, { status: 400 });
        }

        await prisma.dept.delete({
            where: { id }
        });

        return NextResponse.json({ code: 200, message: '删除成功' });
    } catch (error) {
        console.error('Dept Delete Error:', error);
        return NextResponse.json({ code: 500, message: '删除失败' }, { status: 500 });
    }
}
