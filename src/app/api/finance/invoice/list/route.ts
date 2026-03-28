import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/finance/invoice/list - 获取开票记录列表
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
            prisma.invoiceRecord.count({ where }),
            prisma.invoiceRecord.findMany({
                where,
                include: {
                    contract: { select: { serialNo: true, name: true, customer: { select: { name: true } } } }
                },
                orderBy: { billingDate: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        const totalAmount = await prisma.invoiceRecord.aggregate({
            where,
            _sum: { amountAmount: true, taxAmount: true }
        });

        return NextResponse.json({
            code: 200,
            data: {
                list: records,
                total,
                page,
                pageSize,
                totalBilled: Number(totalAmount._sum?.amountAmount || 0),
                totalTax: Number(totalAmount._sum?.taxAmount || 0)
            }
        });
    } catch (error: any) {
        console.error('[invoice/list] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}

// POST /api/finance/invoice/list - 登记新开票记录
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 });

        const body = await req.json();
        const { contractId, invoiceNo, invoiceType, amountAmount, taxRate, billingDate, title, remark } = body;

        if (!contractId || !invoiceNo || !amountAmount || !billingDate) {
            return NextResponse.json({ code: 400, message: '合同、发票号、金额、开票日期为必填项' }, { status: 400 });
        }

        const amount = parseFloat(amountAmount);
        const rate = parseFloat(taxRate || '6');
        const taxAmount = amount * (rate / (100 + rate)); // 价税分离

        const admin = await prisma.user.findFirst({ where: { id: session.userId } });
        const handlerName = admin?.name || session.name || '系统管理员';

        const record = await prisma.invoiceRecord.create({
            data: {
                contractId,
                invoiceNo,
                invoiceType: invoiceType || 'VAT_SPECIAL',
                amountAmount: amount,
                taxRate: rate,
                taxAmount: parseFloat(taxAmount.toFixed(2)),
                billingDate: new Date(billingDate),
                title: title || null,
                handlerId: session.userId,
                handlerName,
                remark: remark || null
            }
        });

        return NextResponse.json({ code: 200, data: record, message: '开票记录登记成功' });
    } catch (error: any) {
        console.error('[invoice/create] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}
