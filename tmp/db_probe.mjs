import prisma from '../src/lib/db.js';

async function probe() {
    console.log('--- 🛡️ 数据库健康探针启动 ---');
    try {
        console.log('1. 测试客户表 (Customer)...');
        const customerCount = await prisma.customer.count();
        console.log(`   ✅ 客户数量: ${customerCount}`);

        console.log('2. 测试项目表 (Project)...');
        const projectCount = await prisma.project.count();
        console.log(`   ✅ 项目数量: ${projectCount}`);

        console.log('3. 检查最后 3 条项目记录...');
        const lastProjects = await prisma.project.findMany({
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        lastProjects.forEach(p => {
            console.log(`   - [${p.serialNo}] ${p.name} (甲方: ${p.customer.name})`);
        });

        console.log('--- 🎊 数据库逻辑链路 100% 正常 ---');
    } catch (err) {
        console.error('--- ❌ 数据库探针发现致命异常 ---');
        console.error('报错信息:', err.message);
        console.error('错误堆栈:', err.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

probe();
