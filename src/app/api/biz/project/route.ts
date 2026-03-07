import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        // Filters
        const name = searchParams.get('name');
        const customerId = searchParams.get('customerId');
        const status = searchParams.get('status');

        const where: any = {};
        if (name) where.name = { contains: name };
        if (customerId) where.customerId = customerId;
        if (status) where.status = status;

        const [total, list] = await prisma.$transaction([
            prisma.project.count({ where }),
            prisma.project.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    customer: { select: { id: true, name: true } }
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
        console.error('Project GET error:', error);
        return NextResponse.json({ code: 500, message: '获取项目数据失败' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let {
            serialNo, name, type, customerId, deptId, deptName, pmId, pmName,
            status, budget, startDate, endDate, remark
        } = body;

        if (!name || !customerId || !type) {
            return NextResponse.json({ code: 400, message: '项目名称、性质与客户为必填项' }, { status: 400 });
        }

        // Auto-generate serialNo if not provided
        if (!serialNo) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const ran = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            serialNo = `XM-${dateStr}-${ran}`;
        } else {
            const existing = await prisma.project.findUnique({ where: { serialNo } });
            if (existing) {
                return NextResponse.json({ code: 400, message: '该项目编号已存在' }, { status: 400 });
            }
        }

        const project = await prisma.project.create({
            data: {
                serialNo,
                name,
                type,
                customerId,
                deptId: deptId || 'UNKNOWN_DEPT',
                deptName: deptName || '未知部门',
                pmId: pmId || 'UNKNOWN_PM',
                pmName: pmName || '未知负责人',
                status: status || 'ACTIVE',
                budget: budget ? parseFloat(budget) : 0,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                remark
            }
        });

        return NextResponse.json({ code: 200, message: '立项成功', data: project });
    } catch (error) {
        console.error('Project POST error:', error);
        return NextResponse.json({ code: 500, message: '立项失败' }, { status: 500 });
    }
}
