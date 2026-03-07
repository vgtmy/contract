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
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        // Explicit filters from frontend
        const deptIdFilter = searchParams.get('deptId');
        const status = searchParams.get('status');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const signDateStart = searchParams.get('signDateStart');
        const signDateEnd = searchParams.get('signDateEnd');

        // Build base where clause
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
            // Admin sees all, can explicitly filter by deptId
            if (deptIdFilter) where.deptId = deptIdFilter;
        } else if (userRole === 'MANAGER') {
            // Manager can only see their own department data
            // Forcing the where condition to their session deptId
            where.deptId = (session as any).deptId || 'unknown';
        } else if (userRole === 'PM') {
            // PM can only see their own created/managed contracts
            where.pmId = session.userId;
        }

        const [total, list] = await prisma.$transaction([
            prisma.contract.count({ where }),
            prisma.contract.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    customer: { select: { id: true, name: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' }
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
        console.error('Contract GET error:', error);
        return NextResponse.json({ code: 500, message: '获取合同台账失败' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权访问' }, { status: 401 });
        }

        const body = await request.json();
        let {
            serialNo, name, type, customerId, projectId,
            totalAmount, signDate, startDate, endDate, taxRate, remark, status
        } = body;

        if (!name || !customerId || !projectId || !type) {
            return NextResponse.json({ code: 400, message: '合同名称、单据类型、所属客户与项目为必填项' }, { status: 400 });
        }

        // Load Project context to inherit core properties safely
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ code: 404, message: '承载此合同的母实体(项目)不存在' }, { status: 404 });
        }

        if (!serialNo) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const ran = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            serialNo = `HT-${dateStr}-${ran}`;
        }

        const contract = await prisma.contract.create({
            data: {
                serialNo,
                name,
                type,
                customerId,
                projectId,
                totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
                taxRate: taxRate ? parseFloat(taxRate) : 0,
                signDate: signDate ? new Date(signDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: status || 'DRAFT',
                remark,
                // INHERIT FROM PROJECT strictly:
                pmId: project.pmId,
                pmName: project.pmName,
                deptId: project.deptId,
                deptName: project.deptName
            }
        });

        await logAction({
            module: 'CONTRACT',
            action: 'CREATE',
            targetId: contract.id,
            summary: `新建总标 ￥${contract.totalAmount} 元的合同卷宗 [${contract.name}]`
        });

        return NextResponse.json({ code: 200, message: '起草成功', data: contract });
    } catch (e) {
        console.error('Contract Draft POST error:', e);
        return NextResponse.json({ code: 500, message: '录入合同系统异常' }, { status: 500 });
    }
}
