import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const asTree = searchParams.get('tree') === '1';

        const depts = await prisma.dept.findMany({
            orderBy: { sort: 'asc' },
        });

        if (asTree) {
            // Convert flat array to tree structure
            const deptMap: Record<string, any> = {};
            const tree: any[] = [];

            depts.forEach((d: any) => {
                deptMap[d.id] = { ...d, children: [] };
            });

            depts.forEach((d: any) => {
                if (d.parentId && deptMap[d.parentId]) {
                    deptMap[d.parentId].children.push(deptMap[d.id]);
                } else {
                    tree.push(deptMap[d.id]);
                }
            });

            return NextResponse.json({ code: 200, data: tree, message: 'success' });
        }

        return NextResponse.json({ code: 200, data: depts, message: 'success' });
    } catch (error) {
        console.error('Dept API Error:', error);
        return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, parentId, managerId, sort } = await request.json();

        if (!name) {
            return NextResponse.json({ code: 400, message: '部门名称不能为空' }, { status: 400 });
        }

        const dept = await prisma.dept.create({
            data: {
                name,
                parentId: parentId || null,
                managerId: managerId || null,
                sort: Number(sort) || 0
            }
        });

        return NextResponse.json({ code: 200, data: dept, message: '创建成功' });
    } catch (error) {
        console.error('Dept Create Error:', error);
        return NextResponse.json({ code: 500, message: '创建失败' }, { status: 500 });
    }
}
