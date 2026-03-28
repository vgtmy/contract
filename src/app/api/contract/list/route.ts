import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { buildContractScopeFilter } from '@/lib/permission';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '10');
        const skip = (page - 1) * pageSize;

        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const query = searchParams.get('query');

        // 权限隔离过滤（角色决定数据范围）
        const scopeFilter = buildContractScopeFilter(session);

        // 业务查询条件合并
        const where: any = { ...scopeFilter };
        if (status) where.status = status;
        if (type) where.type = type;
        if (query) {
            where.OR = [
                { name: { contains: query } },
                { serialNo: { contains: query } },
                { customer: { name: { contains: query } } }
            ];
        }

        const [total, list] = await Promise.all([
            prisma.contract.count({ where }),
            prisma.contract.findMany({
                where,
                include: {
                    customer: { select: { name: true } },
                    project: { select: { name: true, serialNo: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            })
        ]);

        // 同角色范围内的汇总（不是全院汇总）
        const summary = await prisma.contract.aggregate({
            where: scopeFilter,
            _sum: { totalAmount: true },
            _count: { id: true }
        });

        return NextResponse.json({
            code: 200,
            data: {
                list,
                pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
                summary: {
                    totalVolume: Number(summary._sum.totalAmount || 0),
                    totalCount: summary._count.id || 0
                }
            },
            message: 'success'
        });
    } catch (error: any) {
        console.error('Contract List Error:', error);
        return NextResponse.json({ code: 500, message: '获取合同台账失败: ' + error.message }, { status: 500 });
    }
}
