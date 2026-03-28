import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { serialNo: 'desc' }
        });
        return NextResponse.json({ code: 200, data: projects, message: 'success' });
    } catch (error) {
        console.error('Project List Error:', error);
        return NextResponse.json({ code: 500, message: '获取项目列表失败' }, { status: 500 });
    }
}
