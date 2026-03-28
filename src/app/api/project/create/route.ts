import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            name, serialNo, type, budget, 
            customerId, startDate, endDate, remark 
        } = body;

        // 1. 基础校验
        if (!name || !serialNo || !customerId) {
            return NextResponse.json({ code: 400, message: '项目名称、编号及甲方不能为空' }, { status: 400 });
        }

        // 2. 获取当前立项人及其部门 (用于归属划分)
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { dept: true }
        });

        if (!user) {
            return NextResponse.json({ code: 404, message: '用户信息异常（请重新登录以同步最新的固化 ID）' }, { status: 404 });
        }

        // 3. 写入立项数据
        const project = await prisma.project.create({
            data: {
                name,
                serialNo,
                type,
                budget: parseFloat(budget || '0'),
                customerId,
                deptId: user.deptId || 'ROOT',
                deptName: user.dept?.name || '公司总部',
                pmId: user.id,
                pmName: user.name,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: 'ACTIVE',
                remark
            }
        });

        return NextResponse.json({ code: 200, data: project, message: '项目立项成功' });
    } catch (error: any) {
        console.error('Project Create Error:', error);
        
        // 唯一约束冲突 (编号重复)
        if (error.code === 'P2002') {
            return NextResponse.json({ code: 400, message: '项目编号已存在，请换一个' }, { status: 400 });
        }

        return NextResponse.json({ code: 500, message: '立项失败: ' + error.message }, { status: 500 });
    }
}
