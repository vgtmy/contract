import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAction } from '@/lib/logger';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id: invoiceId, invoiceNo, invoiceType, amountAmount, taxRate, billingDate, title, remark } = body;

        if (!invoiceId) return NextResponse.json({ code: 400, message: '缺失发票档案戳' }, { status: 400 });

        const amountNum = amountAmount !== undefined ? parseFloat(amountAmount) : undefined;
        if (amountNum !== undefined && (isNaN(amountNum) || amountNum <= 0)) {
            return NextResponse.json({ code: 400, message: '金额必须为合规的数字' }, { status: 400 });
        }

        if (amountNum !== undefined) {
            const record = await prisma.invoiceRecord.findUnique({ where: { id: invoiceId } });
            if (!record) return NextResponse.json({ code: 404, message: '源发票卷宗不存在' }, { status: 404 });

            const contract = await prisma.contract.findUnique({ where: { id: record.contractId }, select: { totalAmount: true } });
            if (contract) {
                const others = await prisma.invoiceRecord.findMany({
                    where: { contractId: record.contractId, NOT: { id: invoiceId } },
                    select: { amountAmount: true }
                });
                const otherSum = others.reduce((acc: number, r: any) => acc + Number(r.amountAmount), 0);
                if (otherSum + amountNum > Number(contract.totalAmount)) {
                    const remaining = Number(contract.totalAmount) - otherSum;
                    return NextResponse.json({
                        code: 400,
                        message: `【防呆校验阻断】该张票面修后金额会导致总发票盘口超标！除本张外历史己开 ￥${otherSum}。本笔修偏阈值上限：￥${remaining}。`
                    }, { status: 400 });
                }
            }
        }

        const updateData: any = {};
        if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;
        if (invoiceType !== undefined) updateData.invoiceType = invoiceType;

        let newTaxRate = undefined;
        if (taxRate !== undefined) {
            newTaxRate = parseFloat(taxRate) || 0;
            updateData.taxRate = newTaxRate;
        }

        if (amountNum !== undefined) {
            updateData.amountAmount = amountNum;

            // Re-calculate tax amount if amount or rate changes
            const recordToComputeOn = await prisma.invoiceRecord.findUnique({ where: { id: invoiceId } });
            const actualRate = newTaxRate !== undefined ? newTaxRate : Number(recordToComputeOn?.taxRate || 0);
            const taxAmt = amountNum / (1 + (actualRate / 100)) * (actualRate / 100);
            updateData.taxAmount = Math.round(taxAmt * 100) / 100;
        } else if (newTaxRate !== undefined) {
            // Only rate changed, recompute using existing amount
            const recordToComputeOn = await prisma.invoiceRecord.findUnique({ where: { id: invoiceId } });
            const baseAmount = Number(recordToComputeOn?.amountAmount || 0);
            const taxAmt = baseAmount / (1 + (newTaxRate / 100)) * (newTaxRate / 100);
            updateData.taxAmount = Math.round(taxAmt * 100) / 100;
        }

        if (billingDate !== undefined) updateData.billingDate = billingDate ? new Date(billingDate) : null;
        if (title !== undefined) updateData.title = title;
        if (remark !== undefined) updateData.remark = remark;

        const updated = await prisma.invoiceRecord.update({
            where: { id: invoiceId },
            data: updateData
        });

        await logAction({
            module: 'INVOICE',
            action: 'UPDATE',
            targetId: invoiceId,
            summary: `更新发票台账(或变更了票面/重新测算了销项税)`
        });

        return NextResponse.json({ code: 200, message: '换票修改登记通关', data: updated });
    } catch (error) {
        console.error('Invoice PUT error:', error);
        return NextResponse.json({ code: 500, message: '更正入库异常' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoiceId');

        if (!invoiceId) return NextResponse.json({ code: 400, message: '缺失索引参数' }, { status: 400 });

        await prisma.invoiceRecord.delete({
            where: { id: invoiceId }
        });

        await logAction({
            module: 'INVOICE',
            action: 'DELETE',
            targetId: invoiceId,
            summary: `彻底作废或收回抽档了一张已开出的发票`
        });

        return NextResponse.json({ code: 200, message: '作废/红冲 销档成功' });
    } catch (error) {
        console.error('Invoice DELETE error:', error);
        return NextResponse.json({ code: 500, message: '抽档故障' }, { status: 500 });
    }
}
