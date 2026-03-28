import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/finance/receipt/list - 获取收款记录列表
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const contractId = searchParams.get('contractId');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = {};
        if (contractId) where.contractId = contractId;

        const [total, records] = await Promise.all([
            prisma.receiptRecord.count({ where }),
            prisma.receiptRecord.findMany({
                where,
                include: {
                    contract: { select: { serialNo: true, name: true, customer: { select: { name: true } } } },
                    plan: { select: { phase: true } }
                },
                orderBy: { receiptDate: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        // 统计汇总
        const totalAmount = await prisma.receiptRecord.aggregate({
            where,
            _sum: { amount: true }
        });

        return NextResponse.json({
            code: 200,
            data: {
                list: records,
                total,
                page,
                pageSize,
                totalAmount: Number(totalAmount._sum.amount || 0)
            }
        });
    } catch (error: any) {
        console.error('[receipt/list] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}

// POST /api/finance/receipt/list - 登记新收款记录
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 });

        const body = await req.json();
        const { contractId, planId, amount, receiptDate, paymentMethod, voucherNo, remark } = body;

        if (!contractId || !amount || !receiptDate) {
            return NextResponse.json({ code: 400, message: '合同、金额、收款日期为必填项' }, { status: 400 });
        }

        const admin = await prisma.user.findFirst({ where: { id: session.userId } });
        const handlerName = admin?.name || session.name || '系统管理员';

        const record = await prisma.receiptRecord.create({
            data: {
                contractId,
                planId: planId || null,
                amount: parseFloat(amount),
                receiptDate: new Date(receiptDate),
                paymentMethod: paymentMethod || 'BANK_TRANSFER',
                voucherNo: voucherNo || null,
                handlerId: session.userId,
                handlerName,
                remark: remark || null
            }
        });

        // 若关联了收款计划，自动更新计划状态为 RECEIVED
        if (planId) {
            await prisma.paymentPlan.update({
                where: { id: planId },
                data: { status: 'RECEIVED' }
            });
        }

        return NextResponse.json({ code: 200, data: record, message: '收款记录登记成功' });
    } catch (error: any) {
        console.error('[receipt/create] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}
