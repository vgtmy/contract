import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ code: 200, data: customers, message: 'success' });
    } catch (error: any) {
        console.error('CRITICAL[Customer List Error]:', error.message, error.stack);
        return NextResponse.json({ 
            code: 500, 
            message: '获取客户列表失败: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
