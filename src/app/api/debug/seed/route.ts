import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- 开始通过 API 触发数据库重置 ---');

        // 1. 初始化基础角色
        const roles = [
            { code: 'ADMIN', name: '超级管理员', description: '拥有系统最高控制权' },
            { code: 'MANAGER', name: '部门负责人', description: '管理所在部门' },
            { code: 'PM', name: '项目经理', description: '负责起草合同' },
        ];

        const roleMap = new Map();
        for (const r of roles) {
            const role = await prisma.role.upsert({
                where: { code: r.code },
                update: r,
                create: r,
            });
            roleMap.set(r.code, role.id);
        }

        // 2. 修正后的菜单数据
        const menuData = [
            { name: '工作台', type: 'MENU', path: '/', permCode: 'sys:dash:view', sort: 10 },
            { name: '档案中心', type: 'DIR', icon: 'FolderIcon', sort: 20, children: [
                { name: '客户库管理', type: 'MENU', path: '/customer/list', permCode: 'biz:customer:list', sort: 10 },
                { name: '业务立项报备', type: 'MENU', path: '/project/list', permCode: 'biz:project:list', sort: 20 },
            ]},
            { name: '合同管理', type: 'DIR', icon: 'DocumentTextIcon', sort: 30, children: [
                { name: '合同起草录入', type: 'MENU', path: '/contract/draft', permCode: 'biz:contract:draft', sort: 10 },
                { name: '合同主台账', type: 'MENU', path: '/contract/ledger', permCode: 'biz:contract:list', sort: 20 },
            ]},
            { name: '财务管理', type: 'DIR', icon: 'CurrencyYenIcon', sort: 40, children: [
                { name: '全院收款计划', type: 'MENU', path: '/finance/payment-plan', permCode: 'fin:plan:list', sort: 10 },
                { name: '进账认款登记', type: 'MENU', path: '/finance/receipt', permCode: 'fin:receipt:list', sort: 20 },
                { name: '发票开具流水', type: 'MENU', path: '/finance/invoice', permCode: 'fin:invoice:list', sort: 30 },
            ]},
            { name: '系统设置', type: 'DIR', icon: 'CogIcon', sort: 50, children: [
                { name: '组织与人员管理', type: 'MENU', path: '/system/users', permCode: 'sys:user:list', sort: 10 },
                { name: '部门架构维护', type: 'MENU', path: '/system/depts', permCode: 'sys:dept:list', sort: 20 },
                { name: '权限角色看板', type: 'MENU', path: '/system/roles', permCode: 'sys:role:list', sort: 30 },
                { name: '全链路审计日志', type: 'MENU', path: '/system/audit-log', permCode: 'sys:log:list', sort: 40 },
            ]},
        ];

        const allMenuIds: string[] = [];
        async function createMenu(item: any, parentId = null) {
            const { children, ...rest } = item;
            const menu = await prisma.menu.create({
                data: { ...rest, parentId }
            });
            allMenuIds.push(menu.id);
            if (children) {
                for (const child of children) {
                    await createMenu(child, menu.id);
                }
            }
        }

        // 清理旧菜单
        await prisma.roleMenu.deleteMany({});
        await prisma.menu.deleteMany({});

        for (const m of menuData) {
            await createMenu(m);
        }

        // 3. 关联角色菜单
        const adminRoleId = roleMap.get('ADMIN');
        if (adminRoleId) {
            await prisma.roleMenu.createMany({
                data: allMenuIds.map(mid => ({ roleId: adminRoleId, menuId: mid }))
            });
        }

        // 4. 初始化默认管理员账号 (若不存在)
        const passwordHash = await bcrypt.hash('123456', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000001',
                username: 'admin',
                password: passwordHash,
                name: '系统管理员',
                status: 1,
            }
        });

        // 绑定角色 (针对新 ID 的 admin 用户)
        const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (adminUser && adminRoleId) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: adminUser.id, roleId: adminRoleId } },
                update: {},
                create: { userId: adminUser.id, roleId: adminRoleId }
            });
        }

        return NextResponse.json({ code: 200, message: '数据库补丁灌入成功，所有菜单路径已修正' });
    } catch (error: any) {
        console.error('Seed API Error:', error);
        return NextResponse.json({ code: 500, message: '灌库失败: ' + error.message });
    }
}
