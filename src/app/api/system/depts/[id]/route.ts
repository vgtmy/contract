import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 1. 修改部门信息 (含组织架构变动)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { name, parentId, managerId, sort, status } = await request.json();

        if (!name) {
            return NextResponse.json({ code: 400, message: '部门名称不能为空' }, { status: 400 });
        }

        // 修改部门架构逻辑
        const dept = await prisma.dept.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null,
                managerId: managerId || null,
                sort: sort !== undefined ? Number(sort) : 0,
                status: status !== undefined ? Number(status) : 1,
            }
        });

        return NextResponse.json({ code: 200, data: dept, message: '修改成功' });
    } catch (error) {
        console.error('Dept Update Error:', error);
        return NextResponse.json({ code: 500, message: '修改失败' }, { status: 500 });
    }
}

// 2. 逻辑停用部门
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // 首先检查是否有下级子部门正在使用且未停用
        const subDeptsCount = await prisma.dept.count({
            where: { parentId: id, status: 1 }
        });

        if (subDeptsCount > 0) {
            return NextResponse.json({ code: 400, message: '该部门下存在活跃子级，请先停用子部门' }, { status: 400 });
        }

        // 检查是否有活跃员工属于此部门
        const userCount = await prisma.user.count({
            where: { deptId: id, status: 1 }
        });

        if (userCount > 0) {
            return NextResponse.json({ code: 400, message: '该部门下存在活跃员工，请先移除或禁用员工' }, { status: 400 });
        }

        // 逻辑停用状态
        await prisma.dept.update({
            where: { id },
            data: { status: 0 }
        });

        return NextResponse.json({ code: 200, message: '部门已成功停用' });
    } catch (error) {
        console.error('Dept Disable Error:', error);
        return NextResponse.json({ code: 500, message: '停用失败' }, { status: 500 });
    }
}
