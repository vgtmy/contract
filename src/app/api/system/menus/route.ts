import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const menus = await prisma.menu.findMany({
            orderBy: { sort: 'asc' }
        });
        return NextResponse.json({ code: 200, data: menus, message: 'success' });
    } catch (error) {
        console.error('Menu List Error:', error);
        return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { parentId, name, type, path, permCode, icon, sort } = await request.json();

        if (!name || !type) {
            return NextResponse.json({ code: 400, message: '名称和类型不能为空' }, { status: 400 });
        }

        const menu = await prisma.menu.create({
            data: {
                parentId: parentId || null,
                name,
                type,
                path: path || null,
                permCode: permCode || null,
                icon: icon || null,
                sort: sort !== undefined ? Number(sort) : 0
            }
        });

        return NextResponse.json({ code: 200, data: menu, message: '创建成功' });
    } catch (error) {
        console.error('Menu Create Error:', error);
        return NextResponse.json({ code: 500, message: '创建失败' }, { status: 500 });
    }
}
