import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const menus = await prisma.menu.findMany({
            orderBy: { sort: 'asc' }
        });

        // 递归转换扁平数组为树形结构
        const convertToTree = (list: any[], parentId: string | null = null) => {
            const tree: any[] = [];
            list.filter(item => item.parentId === parentId).forEach(item => {
                const children = convertToTree(list, item.id);
                tree.push({
                    ...item,
                    children: children.length > 0 ? children : undefined
                });
            });
            return tree;
        };

        const treeData = convertToTree(menus);

        return NextResponse.json({ code: 200, data: treeData, message: 'success' });
    } catch (error) {
        console.error('Menu Tree Error:', error);
        return NextResponse.json({ code: 500, message: '获取菜单树失败' }, { status: 500 });
    }
}
