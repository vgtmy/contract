import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, context: any) {
    try {
        const userId = (await context.params).id;
        const { roleIds } = await request.json();

        if (!Array.isArray(roleIds)) {
            return NextResponse.json({ code: 400, message: '无效参数' }, { status: 400 });
        }

        // Since many-to-many relationship mapping relies on the join table,
        // we use a transaction to delete all old and create all new
        await prisma.$transaction([
            prisma.userRole.deleteMany({
                where: { userId }
            }),
            prisma.userRole.createMany({
                data: roleIds.map((rId: string) => ({
                    userId,
                    roleId: rId
                }))
            })
        ]);

        return NextResponse.json({ code: 200, message: '角色分配成功' });
    } catch (error) {
        console.error('Role Assign Error:', error);
        return NextResponse.json({ code: 500, message: '角色分配失败' }, { status: 500 });
    }
}
