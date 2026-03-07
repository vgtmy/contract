import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        // Filters
        const name = searchParams.get('name');
        const type = searchParams.get('type');
        const creditLevel = searchParams.get('creditLevel');

        const where: Prisma.CustomerWhereInput = {};
        if (name) where.name = { contains: name };
        if (type) where.type = type;
        if (creditLevel) where.creditLevel = creditLevel;

        const [total, list] = await prisma.$transaction([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
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
        console.error('Customer GET error:', error);
        return NextResponse.json({ code: 500, message: '获取客户数据失败' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, creditLevel, contactPerson, contactPhone, taxNumber, address } = body;

        if (!name || !type) {
            return NextResponse.json({ code: 400, message: '客户名称与性质为必填项' }, { status: 400 });
        }

        const existing = await prisma.customer.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json({ code: 400, message: '该客户名称已存在，请核实' }, { status: 400 });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                type,
                creditLevel: creditLevel || 'A',
                contactPerson,
                contactPhone,
                taxNumber,
                address
            }
        });

        return NextResponse.json({ code: 200, message: '创建成功', data: customer });
    } catch (error) {
        console.error('Customer POST error:', error);
        return NextResponse.json({ code: 500, message: '创建失败' }, { status: 500 });
    }
}
