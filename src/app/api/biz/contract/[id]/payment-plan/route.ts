import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAction } from '@/lib/logger';

export async function PUT(request: Request, context: any) {
    try {
        // Here context.params.id is the contractId because of file path, 
        // but we need planId from body or query. Given REST best practice for nested: 
        // /api/biz/contract/:contractId/payment-plan?planId=xxx
        const body = await request.json();
        const { id: planId, phase, expectedAmount, expectedDate, condition, status, remark } = body;

        if (!planId) {
            return NextResponse.json({ code: 400, message: '未指定更新的具体计划条目' }, { status: 400 });
        }

        const amountNum = expectedAmount !== undefined ? parseFloat(expectedAmount) : undefined;
        if (amountNum !== undefined && (isNaN(amountNum) || amountNum <= 0)) {
            return NextResponse.json({ code: 400, message: '收款金额必须是合法的正数' }, { status: 400 });
        }

        // Security Check: if amount is changing, ensure total doesn't exceed contract total
        if (amountNum !== undefined) {
            const planItem = await prisma.paymentPlan.findUnique({ where: { id: planId } });
            if (!planItem) return NextResponse.json({ code: 404, message: '条目不存在' }, { status: 404 });

            const contract = await prisma.contract.findUnique({ where: { id: planItem.contractId }, select: { totalAmount: true } });
            if (contract) {
                const existingPlans = await prisma.paymentPlan.findMany({
                    where: { contractId: planItem.contractId, NOT: { id: planId } },
                    select: { expectedAmount: true }
                });
                const otherSum = existingPlans.reduce((acc: number, p: any) => acc + Number(p.expectedAmount), 0);
                if (otherSum + amountNum > Number(contract.totalAmount)) {
                    const remaining = Number(contract.totalAmount) - otherSum;
                    return NextResponse.json({
                        code: 400,
                        message: `【财务防爆拦截】更改后的额度超标！除本条外，其余期次已占用 ￥${otherSum}。本期最多可设为 ￥${remaining}。`
                    }, { status: 400 });
                }
            }
        }

        const updateData: any = {};
        if (phase !== undefined) updateData.phase = phase;
        if (amountNum !== undefined) updateData.expectedAmount = amountNum;
        if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;
        if (condition !== undefined) updateData.condition = condition;
        if (status !== undefined) updateData.status = status;
        if (remark !== undefined) updateData.remark = remark;

        const updated = await prisma.paymentPlan.update({
            where: { id: planId },
            data: updateData
        });

        await logAction({
            module: 'PAYMENT_PLAN',
            action: 'UPDATE',
            targetId: planId,
            summary: `更新了合同计划期次的挂载数字与时间`
        });

        return NextResponse.json({ code: 200, message: '更新成功', data: updated });

    } catch (error) {
        console.error('PaymentPlan PUT error:', error);
        return NextResponse.json({ code: 500, message: '更新异常' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const planId = searchParams.get('planId');

        if (!planId) {
            return NextResponse.json({ code: 400, message: '未提供计划单号' }, { status: 400 });
        }

        // In a more robust system, check if financial receipts are already bound to it.
        // For minimum closed loop now, we allow hard delete of the plan if no receipt is bound (we don't have receipts yet)

        await prisma.paymentPlan.delete({
            where: { id: planId }
        });

        await logAction({
            module: 'PAYMENT_PLAN',
            action: 'DELETE',
            targetId: planId,
            summary: `强制切断/移除了指定的计划期次节点`
        });

        return NextResponse.json({ code: 200, message: '移除节点成功' });

    } catch (error) {
        console.error('PaymentPlan DELETE error:', error);
        return NextResponse.json({ code: 500, message: '移除异常' }, { status: 500 });
    }
}
