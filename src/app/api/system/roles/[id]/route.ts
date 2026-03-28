import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 1. 修改角色信息
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { name, description, code } = await request.json();

        if (!name || !code) {
            return NextResponse.json({ code: 400, message: '角色名称和编码不能为空' }, { status: 400 });
        }

        const role = await prisma.role.update({
            where: { id },
            data: {
                name,
                code,
                description
            }
        });

        return NextResponse.json({ code: 200, data: role, message: '修改成功' });
    } catch (error) {
        console.error('Role Update Error:', error);
        return NextResponse.json({ code: 500, message: '修改失败' }, { status: 500 });
    }
}

// 2. 删除角色 (危险操作，需解绑用户)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // 检查是否有用户占用了此角色
        const userCount = await prisma.userRole.count({
            where: { roleId: id }
        });

        if (userCount > 0) {
            return NextResponse.json({ code: 400, message: '该角色下尚有用户存续，请先解除关联' }, { status: 400 });
        }

        // 物理删除角色及其权限关联 (级联)
        await prisma.role.delete({
            where: { id }
        });

        return NextResponse.json({ code: 200, message: '角色已成功移除' });
    } catch (error) {
        console.error('Role Delete Error:', error);
        return NextResponse.json({ code: 500, message: '删除失败' }, { status: 500 });
    }
}
