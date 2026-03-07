import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ code: 200, data: roles, message: 'success' });
    } catch (error) {
        return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { code, name, description } = await request.json();

        if (!code || !name) {
            return NextResponse.json({ code: 400, message: '角色编码和名称不能为空' }, { status: 400 });
        }

        // Check if code exists
        const existing = await prisma.role.findUnique({
            where: { code }
        });

        if (existing) {
            return NextResponse.json({ code: 400, message: '角色编码已存在' }, { status: 400 });
        }

        const role = await prisma.role.create({
            data: {
                code,
                name,
                description
            }
        });

        return NextResponse.json({ code: 200, data: role, message: '创建成功' });
    } catch (error) {
        console.error('Role Create Error:', error);
        return NextResponse.json({ code: 500, message: '创建失败' }, { status: 500 });
    }
}
