import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const customer = await prisma.customer.findUnique({
            where: { id }
        });

        if (!customer) {
            return NextResponse.json({ code: 404, message: '找不到对应客户' }, { status: 404 });
        }

        return NextResponse.json({ code: 200, data: customer, message: 'success' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '查询客户详情失败' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const body = await request.json();

        // Omit id from body just in case
        const { id: _, name, ...updateData } = body;

        // Check name duplicate if it's being changed
        if (name) {
            const existing = await prisma.customer.findFirst({
                where: { name, NOT: { id } }
            });
            if (existing) {
                return NextResponse.json({ code: 400, message: '客户名称已存在，请核实' }, { status: 400 });
            }
            updateData.name = name;
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ code: 200, message: '更新成功', data: customer });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '更新客户信息失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const id = (await context.params).id;

        // TODO in Sprint 3: Check if there are bounded Projects or Contracts before deleting
        // const contractCount = await prisma.contract.count({ where: { customerId: id } });
        // if (contractCount > 0) return 400 Error.

        await prisma.customer.delete({ where: { id } });

        return NextResponse.json({ code: 200, message: '删除成功' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '删除失败，可能仍有业务数据残留' }, { status: 500 });
    }
}
