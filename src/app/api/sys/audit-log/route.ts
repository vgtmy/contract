import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权访问' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '15');

        const operatorName = searchParams.get('operatorName');
        const module = searchParams.get('module');
        const actionType = searchParams.get('actionType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {};

        if (operatorName) where.operatorName = { contains: operatorName };
        if (module) where.module = module;
        if (actionType) where.actionType = actionType;

        if (startDate || endDate) {
            where.actionTime = {};
            if (startDate) where.actionTime.gte = new Date(startDate);
            if (endDate) where.actionTime.lte = new Date(endDate);
        }

        // --- 安全隔离判断逻辑 ---
        if (session.role !== 'ADMIN') {
            // MVP 阶段：仅有 ADMIN 才允许查阅中央审计流水。经理或普通员工无法窥探同事的全局操作日志。
            return NextResponse.json({ code: 403, message: '权限不足：仅系统超管可查阅防线审计中心' }, { status: 403 });
        }

        const [total, list] = await prisma.$transaction([
            prisma.sysAuditLog.count({ where }),
            prisma.sysAuditLog.findMany({
                where,
                orderBy: { actionTime: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        return NextResponse.json({
            code: 200,
            message: 'success',
            data: {
                list,
                pagination: { total, current: page, pageSize }
            }
        });

    } catch (error) {
        console.error('AuditLog GET error:', error);
        return NextResponse.json({ code: 500, message: '获取安全审计记录失败' }, { status: 500 });
    }
}
