import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('--- 业务数据初始化 Seed 脚本启动 ---');

  // 1. 创建演示客户
  const customer = await prisma.customer.upsert({
    where: { name: '未来城市建设投资集团' },
    update: {},
    create: {
      name: '未来城市建设投资集团',
      type: '国有企业',
      creditLevel: 'A',
      contactPerson: '张经理',
      contactPhone: '13800000001',
      address: '上海市浦东新区陆家嘴环路 1000 号',
    },
  });
  console.log('✅ 演示客户已就绪:', customer.name);

  // 2. 创建演示项目
  const project = await prisma.project.upsert({
    where: { serialNo: 'XM-2026-001' },
    update: {},
    create: {
      serialNo: 'XM-2026-001',
      name: '浦东新区 2026 城市韧性更新专项规划',
      type: '专项咨询',
      customerId: customer.id,
      deptName: '规划设计一所',
      pmName: '项目负责人A',
      budget: 500000,
      status: 'ACTIVE',
    },
  });
  console.log('✅ 演示项目已就绪:', project.name);

  console.log('--- 业务数据初始化完成 ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
