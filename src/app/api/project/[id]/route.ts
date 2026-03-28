import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                customer: true,
                contracts: {
                    select: {
                        id: true,
                        name: true,
                        serialNo: true,
                        totalAmount: true,
                        status: true,
                        signDate: true,
                        pmName: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ code: 404, message: '找不到此项目' }, { status: 404 });
        }

        return NextResponse.json({ code: 200, data: project, message: 'success' });
    } catch (error) {
        console.error('Project Detail Error:', error);
        return NextResponse.json({ code: 500, message: '获取项目详情失败' }, { status: 500 });
    }
}
