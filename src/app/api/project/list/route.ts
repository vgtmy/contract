import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            include: {
                customer: true,
                contracts: {
                    select: {
                        totalAmount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 加工数据：增加 contractedTotal 字段
        const data = projects.map((p: any) => {
            const contractedTotal = p.contracts.reduce((sum: number, c: any) => sum + Number(c.totalAmount), 0);
            return {
                ...p,
                contractedTotal,
                contractsCount: p.contracts.length,
                contracts: undefined // 不返回全量合同列表以节省带宽
            };
        });

        return NextResponse.json({ code: 200, data, message: 'success' });
    } catch (error: any) {
        console.error('CRITICAL[Project List Error]:', error.message, error.stack);
        return NextResponse.json({ 
            code: 500, 
            message: '获取项目列表失败: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
