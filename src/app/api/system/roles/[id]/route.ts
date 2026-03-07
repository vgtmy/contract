import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const { name, description } = await request.json();

        const role = await prisma.role.update({
            where: { id },
            data: {
                name,
                description
            }
        });

        return NextResponse.json({ code: 200, data: role, message: '更新成功' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '更新失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const id = (await context.params).id;

        // Check if roles are assigned to any user
        const userRoleCount = await prisma.userRole.count({
            where: { roleId: id }
        });

        if (userRoleCount > 0) {
            return NextResponse.json({ code: 400, message: '已有用户绑定该角色，不允许删除' }, { status: 400 });
        }

        await prisma.role.delete({
            where: { id }
        });

        return NextResponse.json({ code: 200, message: '删除成功' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '删除失败' }, { status: 500 });
    }
}
