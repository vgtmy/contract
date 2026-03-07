import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAction } from '@/lib/logger';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id: receiptId, planId, amount, receiptDate, paymentMethod, voucherNo, remark } = body;

        if (!receiptId) return NextResponse.json({ code: 400, message: '缺失流水单号' }, { status: 400 });

        const amountNum = amount !== undefined ? parseFloat(amount) : undefined;
        if (amountNum !== undefined && (isNaN(amountNum) || amountNum <= 0)) {
            return NextResponse.json({ code: 400, message: '金额必须是合法的正数' }, { status: 400 });
        }

        if (amountNum !== undefined) {
            const record = await prisma.receiptRecord.findUnique({ where: { id: receiptId } });
            if (!record) return NextResponse.json({ code: 404, message: '流水不存在' }, { status: 404 });

            const contract = await prisma.contract.findUnique({ where: { id: record.contractId }, select: { totalAmount: true } });
            if (contract) {
                const existingReceipts = await prisma.receiptRecord.findMany({
                    where: { contractId: record.contractId, NOT: { id: receiptId } },
                    select: { amount: true }
                });
                const otherSum = existingReceipts.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
                if (otherSum + amountNum > Number(contract.totalAmount)) {
                    const remaining = Number(contract.totalAmount) - otherSum;
                    return NextResponse.json({
                        code: 400,
                        message: `【财务防爆拦截】更改后的实收数字超标！除本笔外，其余流水已入账 ￥${otherSum}。本笔最高只可调整为 ￥${remaining}。`
                    }, { status: 400 });
                }
            }
        }

        const updateData: any = {};
        if (planId !== undefined) updateData.planId = planId || null;
        if (amountNum !== undefined) updateData.amount = amountNum;
        if (receiptDate !== undefined) updateData.receiptDate = receiptDate ? new Date(receiptDate) : null;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (voucherNo !== undefined) updateData.voucherNo = voucherNo;
        if (remark !== undefined) updateData.remark = remark;

        const updated = await prisma.receiptRecord.update({
            where: { id: receiptId },
            data: updateData
        });

        await logAction({
            module: 'RECEIPT',
            action: 'UPDATE',
            targetId: receiptId,
            summary: `修正了已登记实收款流水数字或方式`
        });

        return NextResponse.json({ code: 200, message: '更正凭证成功', data: updated });
    } catch (error) {
        console.error('Receipt PUT error:', error);
        return NextResponse.json({ code: 500, message: '更正异常' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const receiptId = searchParams.get('receiptId');

        if (!receiptId) return NextResponse.json({ code: 400, message: '未提供流水号' }, { status: 400 });

        const record = await prisma.receiptRecord.delete({
            where: { id: receiptId }
        });

        await logAction({
            module: 'RECEIPT',
            action: 'DELETE',
            targetId: receiptId,
            summary: `强行冲红移除了一笔既有实收款项`
        });

        // Auto-revert the associated plan status loosely if no other receipts exist for it, 
        // but to keep it simple we'll skip complex auto-reversions for MVP.

        return NextResponse.json({ code: 200, message: '流水冲红/移除成功' });

    } catch (error) {
        console.error('Receipt DELETE error:', error);
        return NextResponse.json({ code: 500, message: '移除异常' }, { status: 500 });
    }
}
