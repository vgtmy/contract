import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/finance/payment-plan - 全院收款计划汇总视图
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // UNMET | PENDING | RECEIVED | OVERDUE
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '30');

        const where: any = {};
        if (status) where.status = status;

        const [total, plans] = await Promise.all([
            prisma.paymentPlan.count({ where }),
            prisma.paymentPlan.findMany({
                where,
                include: {
                    receipts: { select: { amount: true } },
                    contract: {
                        select: {
                            serialNo: true,
                            name: true,
                            pmName: true,
                            deptName: true,
                            customer: { select: { name: true } }
                        }
                    }
                },
                orderBy: [
                    { status: 'asc' },
                    { expectedDate: 'asc' }
                ],
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        // 统计各状态金额
        const stats = await prisma.paymentPlan.groupBy({
            by: ['status'],
            _sum: { expectedAmount: true },
            _count: true
        });

        const statsMap = stats.reduce((acc: Record<string, { count: number; amount: number }>, s: any) => {
            acc[s.status] = {
                count: s._count,
                amount: Number(s._sum.expectedAmount || 0)
            };
            return acc;
        }, {});

        // 对 list 中的每一项计算实收总额
        const plansWithActual = plans.map((p: any) => ({
            ...p,
            actualAmount: p.receipts.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
        }));

        return NextResponse.json({
            code: 200,
            data: {
                list: plansWithActual,
                total,
                page,
                pageSize,
                stats: {
                    UNMET:    statsMap['UNMET']    || { count: 0, amount: 0 },
                    PENDING:  statsMap['PENDING']  || { count: 0, amount: 0 },
                    RECEIVED: statsMap['RECEIVED'] || { count: 0, amount: 0 },
                    OVERDUE:  statsMap['OVERDUE']  || { count: 0, amount: 0 }
                }
            }
        });
    } catch (error: any) {
        console.error('[payment-plan] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}
