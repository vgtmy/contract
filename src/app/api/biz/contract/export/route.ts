export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权访问' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Filters matching the ledger list
        const deptIdFilter = searchParams.get('deptId');
        const status = searchParams.get('status');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const signDateStart = searchParams.get('signDateStart');
        const signDateEnd = searchParams.get('signDateEnd');

        const where: any = {};

        if (status) where.status = status;
        if (minAmount) where.totalAmount = { gte: parseFloat(minAmount) };
        if (maxAmount) where.totalAmount = { ...where.totalAmount, lte: parseFloat(maxAmount) };

        if (signDateStart || signDateEnd) {
            where.signDate = {};
            if (signDateStart) where.signDate.gte = new Date(signDateStart);
            if (signDateEnd) where.signDate.lte = new Date(signDateEnd);
        }

        // --- DATA PERMISSION LOGIC ---
        const userRole = session.role;

        if (userRole === 'ADMIN') {
            if (deptIdFilter) where.deptId = deptIdFilter;
        } else if (userRole === 'MANAGER') {
            where.deptId = (session as any).deptId || 'unknown';
        } else if (userRole === 'PM') {
            where.pmId = session.userId;
        }

        // Fetch without pagination but include relations for export data
        const contracts = await prisma.contract.findMany({
            where,
            include: {
                customer: { select: { name: true } },
                project: { select: { name: true } },
                receipts: { select: { amount: true } },
                invoices: { select: { amountAmount: true } },
                files: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' },
            // Hard limit to prevent memory issues on extremely large datasets during initial MVP
            take: 5000
        });

        // Format data for easier Excel generation in frontend
        const exportData = contracts.map((c: any) => {
            const receiptSum = c.receipts.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
            const invoiceSum = c.invoices.reduce((acc: number, i: any) => acc + Number(i.amountAmount), 0);

            let statusText = '草拟录入';
            if (c.status === 'PROCESS') statusText = '审批中';
            else if (c.status === 'ACTIVE') statusText = '履行中';
            else if (c.status === 'CLOSED') statusText = '已结案';

            return {
                serialNo: c.serialNo,
                name: c.name,
                customerName: c.customer?.name || '-',
                projectName: c.project?.name || '-',
                deptName: c.deptName,
                pmName: c.pmName,
                totalAmount: Number(c.totalAmount),
                signDate: c.signDate ? c.signDate.toISOString().split('T')[0] : '-',
                status: statusText,
                receiptAmount: receiptSum,
                invoiceAmount: invoiceSum,
                unreceivedAmount: Math.max(Number(c.totalAmount) - receiptSum, 0),
                fileCount: c.files.length
            };
        });

        await logAction({
            module: 'EXPORT',
            action: 'EXPORT',
            summary: `抽拉导出了 ${exportData.length} 笔合同核心台账数据至外部 Excel`
        });

        return NextResponse.json({
            code: 200,
            message: 'success',
            data: exportData
        });

    } catch (error) {
        console.error('Contract Export API error:', error);
        return NextResponse.json({ code: 500, message: '合同台账导出提取失败' }, { status: 500 });
    }
}
