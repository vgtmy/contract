import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                customer: true,
                contracts: true
            }
        });

        if (!project) {
            return NextResponse.json({ code: 404, message: '找不到对应项目' }, { status: 404 });
        }

        return NextResponse.json({ code: 200, data: project, message: 'success' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '查询项目详情失败' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const body = await request.json();

        const { id: _, serialNo, startDate, endDate, budget, ...updateData } = body;

        // Data conversions
        if (budget !== undefined) updateData.budget = parseFloat(budget);
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);

        if (serialNo) {
            const existing = await prisma.project.findFirst({
                where: { serialNo, NOT: { id } }
            });
            if (existing) {
                return NextResponse.json({ code: 400, message: '编号已存在冲突' }, { status: 400 });
            }
            updateData.serialNo = serialNo;
        }

        const project = await prisma.project.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ code: 200, message: '更新成功', data: project });
    } catch (error) {
        console.error('Project PUT error', error);
        return NextResponse.json({ code: 500, message: '更新项目信息失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const id = (await context.params).id;

        // Strict validation: Prevent deletion if there are bounded contracts
        const contractCount = await prisma.contract.count({ where: { projectId: id } });
        if (contractCount > 0) {
            return NextResponse.json({ code: 400, message: '该项目下已绑定合同，无法删除。请先处理关联合同。' }, { status: 400 });
        }

        await prisma.project.delete({ where: { id } });

        return NextResponse.json({ code: 200, message: '删除成功' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '删除失败' }, { status: 500 });
    }
}
