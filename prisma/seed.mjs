import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 系统初始化 Seed 脚本启动 ---');

  // 1. 初始化基础角色
  const roles = [
    { code: 'ADMIN', name: '超级管理员', description: '拥有系统最高控制权，可进行全院台账穿透与权限下发。' },
    { code: 'MANAGER', name: '部门负责人', description: '管理所在部门的业务流水，具有本部门数据的审核权限。' },
    { code: 'PM', name: '项目经理', description: '负责起草合同、维护客户、发起开票申请，仅操作个人权限范围内数据。' },
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
  console.log('✅ 基础角色定义已同步');

  // 2. 初始化菜单池与按钮权限
  const menuData = [
    { name: '工作台', type: 'MENU', path: '/(dashboard)', permCode: 'sys:dash:view', sort: 10 },
    
    // 档案中心
    { name: '档案中心', type: 'DIR', icon: 'FolderIcon', sort: 20, children: [
        { name: '客户库管理', type: 'MENU', path: '/customer/list', permCode: 'biz:customer:list', sort: 10 },
        { name: '业务立项报备', type: 'MENU', path: '/project/list', permCode: 'biz:project:list', sort: 20 },
    ]},
    
    // 合同管理
    { name: '合同管理', type: 'DIR', icon: 'DocumentTextIcon', sort: 30, children: [
        { name: '合同起草录入', type: 'MENU', path: '/contract/draft', permCode: 'biz:contract:draft', sort: 10 },
        { name: '合同主台账', type: 'MENU', path: '/contract/ledger', permCode: 'biz:contract:list', sort: 20 },
    ]},
    
    // 财务管理
    { name: '财务管理', type: 'DIR', icon: 'CurrencyYenIcon', sort: 40, children: [
        { name: '全院收款计划', type: 'MENU', path: '/finance/payment-plan', permCode: 'fin:plan:list', sort: 10 },
        { name: '进账认款登记', type: 'MENU', path: '/finance/receipt', permCode: 'fin:receipt:list', sort: 20 },
        { name: '发票开具流水', type: 'MENU', path: '/finance/invoice', permCode: 'fin:invoice:list', sort: 30 },
    ]},
    
    // 系统设置
    { name: '系统设置', type: 'DIR', icon: 'CogIcon', sort: 50, children: [
        { name: '组织与人员管理', type: 'MENU', path: '/system/users', permCode: 'sys:user:list', sort: 10 },
        { name: '部门架构维护', type: 'MENU', path: '/system/depts', permCode: 'sys:dept:list', sort: 20 },
        { name: '权限角色看板', type: 'MENU', path: '/system/roles', permCode: 'sys:role:list', sort: 30 },
        { name: '全链路审计日志', type: 'MENU', path: '/system/audit-log', permCode: 'sys:log:list', sort: 40 },
    ]},
  ];

  const allMenuIds = [];

  async function createMenu(item, parentId = null) {
    const { children, ...rest } = item;
    const menu = await prisma.menu.create({
      data: {
        ...rest,
        parentId,
      }
    });
    allMenuIds.push(menu.id);
    
    if (children) {
      for (const child of children) {
        await createMenu(child, menu.id);
      }
    }
  }

  // 清空旧菜单 (防止重复运行导致唯一约束冲突)
  await prisma.roleMenu.deleteMany({});
  await prisma.menu.deleteMany({});

  for (const m of menuData) {
    await createMenu(m);
  }
  console.log(`✅ ${allMenuIds.length} 项菜单权限已按树形灌入系统`);

  // 3. 将所有权限由超级管理员 ADMIN 持有
  const adminRoleId = roleMap.get('ADMIN');
  if (adminRoleId) {
    await prisma.roleMenu.createMany({
      data: allMenuIds.map(mid => ({
        roleId: adminRoleId,
        menuId: mid,
      }))
    });
    console.log('✅ 已完成 ADMIN 角色权限矩阵全量映射');
  }

  // 4. 初始化默认管理员账号 (若不存在)
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.upsert({
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

  // 绑定 ADMIN 角色给 admin 用户
  await prisma.userRole.upsert({
    where: { 
        userId_roleId: { userId: adminUser.id, roleId: adminRoleId } 
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRoleId,
    }
  });
  console.log('✅ 系统超级管理员 admin (密码123456) 已激活');

  console.log('--- 初始数据初始化完成 ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
