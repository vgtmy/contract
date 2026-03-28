import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const module = searchParams.get('module');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '30');

        const where: any = {};
        if (module) where.module = module;

        const [total, logs] = await Promise.all([
            prisma.sysAuditLog.count({ where }),
            prisma.sysAuditLog.findMany({
                where,
                orderBy: { actionTime: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        return NextResponse.json({ code: 200, data: { list: logs, total, page, pageSize } });
    } catch (error: any) {
        console.error('[audit-log] Error:', error);
        return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
    }
}
