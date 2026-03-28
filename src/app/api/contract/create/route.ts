import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            name, serialNo, type, totalAmount, 
            customerId, projectId, signDate, remark, 
            paymentPlans 
        } = body;

        // 1. 基础校验
        if (!name || !serialNo || !totalAmount || !customerId) {
            return NextResponse.json({ code: 400, message: '请完善合同名称、编号、金额及甲方信息' }, { status: 400 });
        }

        // 2. 金额平衡校验
        const allocatedAmount = paymentPlans?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        if (Math.abs(totalAmount - allocatedAmount) > 0.01) {
            return NextResponse.json({ 
                code: 400, 
                message: `金额不平：合同总计 ${totalAmount} 元，收款节点共计 ${allocatedAmount} 元` 
            }, { status: 400 });
        }

        // 3. 获取当前 PM 及 部门信息
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { dept: true }
        });

        if (!user) {
            return NextResponse.json({ code: 404, message: '当前用户信息不存在' }, { status: 404 });
        }

        // 4. 事务创建合同与期次
        const result = await prisma.$transaction(async (tx) => {
            // 创建合同
            const contract = await tx.contract.create({
                data: {
                    name,
                    serialNo,
                    type,
                    totalAmount,
                    signDate: signDate ? new Date(signDate) : null,
                    remark,
                    customerId,
                    projectId: projectId || null,
                    pmId: user.id,
                    pmName: user.name,
                    deptId: user.deptId || 'ROOT',
                    deptName: user.dept?.name || '公司总部',
                    status: 'DRAFT', // 初始状态为草稿
                    
                    // 嵌套创建收款计划
                    paymentPlans: {
                        create: paymentPlans.map((p: any) => ({
                            phase: p.phase,
                            expectedAmount: p.amount,
                            condition: p.condition,
                            expectedDate: p.expectedDate ? new Date(p.expectedDate) : null,
                            status: 'UNMET'
                        }))
                    }
                }
            });

            return contract;
        });

        return NextResponse.json({ code: 200, data: result, message: '创建成功' });
    } catch (error: any) {
        console.error('Contract Create Error:', error);
        
        // 处理唯一约束冲突 (编号重复)
        if (error.code === 'P2002') {
            return NextResponse.json({ code: 400, message: '合同编号已存在，请勿重复使用' }, { status: 400 });
        }

        return NextResponse.json({ code: 500, message: '系统保存失败: ' + error.message }, { status: 500 });
    }
}
