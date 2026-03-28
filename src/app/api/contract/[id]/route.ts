import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const { id } = await params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                paymentPlans: { orderBy: { createdAt: 'asc' } },
                customer: true,
                project: true,
                files: true,
            }
        });

        if (!contract) {
            return NextResponse.json({ code: 404, message: '找不到此合同' }, { status: 404 });
        }

        return NextResponse.json({ code: 200, data: contract, message: 'success' });
    } catch (error) {
        console.error('Contract Detail Error:', error);
        return NextResponse.json({ code: 500, message: '获取合同详情失败' }, { status: 500 });
    }
}
