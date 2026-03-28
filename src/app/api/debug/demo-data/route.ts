import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/demo-data
 * 一键创建完整的演示业务数据链路：
 * 客户 → 项目 → 合同 → 收款计划
 * 
 * 使用固定业务 UUID 保证幂等性。
 * 管理员用户通过 username 动态查找（兼容任意 DB 状态）。
 */
export async function GET() {
    try {
        const CUSTOMER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
        const PROJECT_ID  = 'bbbbbbbb-0000-0000-0000-000000000001';
        const CONTRACT_ID = 'cccccccc-0000-0000-0000-000000000001';

        // 1. 动态查找管理员（不依赖固化 ID，兼容所有 DB 状态）
        const admin = await prisma.user.findFirst({
            where: { username: 'admin' }
        });
        
        if (!admin) {
            return NextResponse.json({
                code: 400,
                message: '管理员账号不存在，请先访问 /api/debug/seed 初始化系统数据'
            }, { status: 400 });
        }

        // 2. 创建/更新客户：深蓝智慧港项目方
        let customer = await prisma.customer.findUnique({ where: { id: CUSTOMER_ID } });
        if (!customer) {
            // 先检查是否有同名客户（unique 约束）
            const existingByName = await prisma.customer.findUnique({ where: { name: '深蓝智慧港项目方' } });
            if (existingByName) {
                customer = existingByName;
            } else {
                customer = await prisma.customer.create({
                    data: {
                        id: CUSTOMER_ID,
                        name: '深蓝智慧港项目方',
                        type: '国有企业',
                        creditLevel: 'A',
                        contactPerson: '王建国',
                        contactPhone: '13800138001',
                        taxNumber: '91440300MABCDEF12X',
                        address: '广东省深圳市南山区科技园深蓝大厦18层'
                    }
                });
            }
        }

        // 3. 创建/更新项目
        let project = await prisma.project.findUnique({ where: { id: PROJECT_ID } });
        if (!project) {
            const existingBySerial = await prisma.project.findUnique({ where: { serialNo: 'XM-2026-001' } });
            if (existingBySerial) {
                project = existingBySerial;
            } else {
                project = await prisma.project.create({
                    data: {
                        id: PROJECT_ID,
                        serialNo: 'XM-2026-001',
                        name: '深蓝智慧港全过程咨询',
                        type: '专项咨询',
                        customerId: customer.id,
                        deptId: 'ROOT',
                        deptName: '公司总部',
                        pmId: admin.id,
                        pmName: admin.name,
                        status: 'ACTIVE',
                        budget: 5000000,
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2027-12-31'),
                        remark: '深蓝智慧港片区全过程管理咨询项目，含规划、设计、施工全阶段服务。'
                    }
                });
            }
        }

        // 4. 创建合同（先删旧的，保证幂等）
        const existingContract = await prisma.contract.findUnique({ where: { id: CONTRACT_ID } });
        if (existingContract) {
            await prisma.paymentPlan.deleteMany({ where: { contractId: CONTRACT_ID } });
            await prisma.contract.delete({ where: { id: CONTRACT_ID } });
        }
        // 如果有同编号的合同也清理
        const existingBySerial = await prisma.contract.findUnique({ where: { serialNo: 'HT-2026-0001' } });
        if (existingBySerial && existingBySerial.id !== CONTRACT_ID) {
            await prisma.paymentPlan.deleteMany({ where: { contractId: existingBySerial.id } });
            await prisma.contract.delete({ where: { id: existingBySerial.id } });
        }

        const contract = await prisma.contract.create({
            data: {
                id: CONTRACT_ID,
                serialNo: 'HT-2026-0001',
                name: '深蓝智慧港咨询服务主协议',
                type: '全过程咨询',
                totalAmount: 5000000,
                signDate: new Date('2026-03-01'),
                startDate: new Date('2026-04-01'),
                endDate: new Date('2027-12-31'),
                taxRate: 6,
                remark: '依据《深蓝智慧港项目全流程咨询合作框架协议》签订，服务内容含规划研究、方案设计深化及施工过程管理。',
                status: 'ACTIVE',
                customerId: customer.id,
                projectId: project.id,
                pmId: admin.id,
                pmName: admin.name,
                deptId: 'ROOT',
                deptName: '公司总部',
                paymentPlans: {
                    create: [
                        {
                            phase: '首付款',
                            expectedAmount: 1500000,
                            expectedDate: new Date('2026-04-15'),
                            condition: '合同签订后7个工作日内，甲方支付合同总额的30%',
                            status: 'RECEIVED'
                        },
                        {
                            phase: '中期进度款',
                            expectedAmount: 2000000,
                            expectedDate: new Date('2026-10-01'),
                            condition: '完成方案设计阶段评审，提交成果报告后10个工作日',
                            status: 'PENDING'
                        },
                        {
                            phase: '竣工验收款',
                            expectedAmount: 1500000,
                            expectedDate: new Date('2027-06-30'),
                            condition: '项目竣工验收通过，归档全套咨询成果文件后15个工作日',
                            status: 'UNMET'
                        }
                    ]
                }
            },
            include: {
                paymentPlans: true
            }
        });

        return NextResponse.json({
            code: 200,
            message: '演示数据全链路创建成功！',
            data: {
                adminUsed: { id: admin.id, name: admin.name },
                customer: { id: customer.id, name: customer.name },
                project: { id: project.id, serialNo: project.serialNo, name: project.name },
                contract: {
                    id: contract.id,
                    serialNo: contract.serialNo,
                    name: contract.name,
                    totalAmount: Number(contract.totalAmount),
                    paymentPlansCount: contract.paymentPlans.length
                },
                verifyAt: {
                    projectList: '/project/list',
                    contractLedger: '/contract/ledger',
                    contractDetail: `/contract/detail/${CONTRACT_ID}`
                }
            }
        });
    } catch (error: any) {
        console.error('[demo-data] Error:', error);
        return NextResponse.json({
            code: 500,
            message: '演示数据创建失败: ' + error.message,
            detail: error.stack?.split('\n').slice(0, 5).join(' | ')
        }, { status: 500 });
    }
}
