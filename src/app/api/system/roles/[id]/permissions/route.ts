import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 1. 获取角色的权限列表 (菜单ID集合)
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const roleMenus = await prisma.roleMenu.findMany({
            where: { roleId: id },
            select: { menuId: true }
        });
        
        const menuIds = roleMenus.map(rm => rm.menuId);
        return NextResponse.json({ code: 200, data: menuIds, message: 'success' });
    } catch (error) {
        console.error('Role Permissions Fetch Error:', error);
        return NextResponse.json({ code: 500, message: '获取权限失败' }, { status: 500 });
    }
}

// 2. 更新角色分配的菜单权限 (全量覆盖)
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { menuIds } = await request.json();

        if (!Array.isArray(menuIds)) {
            return NextResponse.json({ code: 400, message: '数据格式错误，menuIds 必须为数组' }, { status: 400 });
        }

        // 使用事务进行删除并重建映射，确保存放一致性
        await prisma.$transaction(async (tx) => {
            // 首先清空该角色的所有旧权限关联
            await tx.roleMenu.deleteMany({
                where: { roleId: id }
            });

            // 批量创建新的权限关联
            if (menuIds.length > 0) {
                await tx.roleMenu.createMany({
                    data: menuIds.map((mId: string) => ({
                        roleId: id,
                        menuId: mId
                    }))
                });
            }
        });

        return NextResponse.json({ code: 200, message: '权限重载成功' });
    } catch (error) {
        console.error('Role Permissions Update Error:', error);
        return NextResponse.json({ code: 500, message: '更新权限失败' }, { status: 500 });
    }
}
