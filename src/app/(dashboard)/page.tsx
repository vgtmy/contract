import React from 'react';
import prisma from '@/lib/db';
import Link from 'next/link';
import { getSession } from '@/lib/auth'; // Might need to check mock user role in the future

export default async function DashboardPage() {
    const session = await getSession();

    // 1. 获取全局合同列表(带关联)用于精确到单合同的风险剥离预结算
    const allContracts = await prisma.contract.findMany({
        include: {
            paymentPlans: { select: { expectedAmount: true, status: true, expectedDate: true } },
            receipts: { select: { amount: true } },
            invoices: { select: { amountAmount: true } }
        }
    });

    // 2. 核心大盘指标口径统计
    const totalCount = allContracts.length;
    let totalContractAmount = 0;

    let activeCount = 0;
    let closedCount = 0;
    let processCount = 0;
    let draftCount = 0;

    let globalPlannedSum = 0;
    let globalReceiptSum = 0;
    let globalInvoiceSum = 0;

    // 交叉风险指标池口径
    let totalInvoiceWithoutMoney = 0; // 已票未收 (垫税金额)
    let totalMoneyWithoutInvoice = 0; // 已收未票 (隐形负债/潜客索赔)
    let overduePlanCount = 0;         // 已逾期的计划期次数 (状态非已收，且时间过期)
    let overduePlanAmount = 0;        // 逾期总本金

    const now = new Date();

    allContracts.forEach((c) => {
        totalContractAmount += Number(c.totalAmount);

        // 状态切片分类计算 (依据字典)
        if (c.status === 'ACTIVE') activeCount++;
        else if (c.status === 'CLOSED') closedCount++;
        else if (c.status === 'PROCESS') processCount++;
        else draftCount++;

        // 当前合同生命周期聚合
        const cPlanSum = c.paymentPlans.reduce((acc, p) => acc + Number(p.expectedAmount), 0);
        const cRecSum = c.receipts.reduce((acc, r) => acc + Number(r.amount), 0);
        const cInvSum = c.invoices.reduce((acc, i) => acc + Number(i.amountAmount), 0);

        globalPlannedSum += cPlanSum;
        globalReceiptSum += cRecSum;
        globalInvoiceSum += cInvSum;

        // 细筛致命风险 —— 单合同维度的差额统计，而非把全公司的收入和开票做直接相减。这样避免互冲。
        const invoiceWithoutMoney = Math.max(cInvSum - cRecSum, 0);
        const moneyWithoutInvoice = Math.max(cRecSum - cInvSum, 0);

        totalInvoiceWithoutMoney += invoiceWithoutMoney;
        totalMoneyWithoutInvoice += moneyWithoutInvoice;

        // 逾期超限计划盘点
        c.paymentPlans.forEach(p => {
            if (p.status !== 'RECEIVED') {
                if (p.expectedDate && new Date(p.expectedDate) < now) {
                    overduePlanCount++;
                    overduePlanAmount += Number(p.expectedAmount);
                }
            }
        });
    });

    return (
        <div className="space-y-6 pb-20">
            {/* 顶部欢迎区 */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 rounded-lg shadow-md text-white">
                <h2 className="text-2xl font-bold mb-2">院级宏观经营驾驶舱</h2>
                <p className="text-blue-100/80">
                    当前时空态势快照：实时监控全院 <strong>{totalCount}</strong> 本台账。警惕垫资敞口与逾期风险。
                </p>
                {session?.role === 'admin' && <p className="mt-2 text-xs bg-white/20 inline-block px-2 py-1 rounded">全局视图最高权限 (穿透查阅)</p>}
            </div>

            {/* 一级金刚板：核心财务量级基石 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">主线确权总盘</p>
                    <p className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-2 mb-2 truncate" title={'￥' + totalContractAmount.toLocaleString()}>
                        <span className="text-sm font-medium text-gray-400 mr-1">￥</span>{totalContractAmount.toLocaleString()}
                    </p>
                    <div className="flex justify-between text-xs text-blue-600 font-medium">
                        <span>总合同册数</span>
                        <span>{totalCount} 卷</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-gray-300">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">应收账款期次盘 (计划)</p>
                    <p className="text-2xl font-black text-gray-700 border-b border-gray-100 pb-2 mb-2 truncate" title={'￥' + globalPlannedSum.toLocaleString()}>
                        <span className="text-sm font-medium text-gray-400 mr-1">￥</span>{globalPlannedSum.toLocaleString()}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>计划额与总盘占比</span>
                        <span>{totalContractAmount ? ((globalPlannedSum / totalContractAmount) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">真金白银现金池 (实收)</p>
                    <p className="text-2xl font-black text-green-700 border-b border-gray-100 pb-2 mb-2 truncate" title={'￥' + globalReceiptSum.toLocaleString()}>
                        <span className="text-sm font-medium text-gray-400 mr-1">￥</span>{globalReceiptSum.toLocaleString()}
                    </p>
                    <div className="flex justify-between text-xs text-green-600 font-medium">
                        <span>回款回收率</span>
                        <span>{totalContractAmount ? ((globalReceiptSum / totalContractAmount) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">法务流转合规口径 (已开票)</p>
                    <p className="text-2xl font-black text-purple-700 border-b border-gray-100 pb-2 mb-2 truncate" title={'￥' + globalInvoiceSum.toLocaleString()}>
                        <span className="text-sm font-medium text-gray-400 mr-1">￥</span>{globalInvoiceSum.toLocaleString()}
                    </p>
                    <div className="flex justify-between text-xs text-purple-600 font-medium">
                        <span>票据占用率</span>
                        <span>{totalContractAmount ? ((globalInvoiceSum / totalContractAmount) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 左列：轻图表与结构解析 */}
                <div className="lg:col-span-1 space-y-6">
                    {/* 图表 1: 合同分布断层 */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">履约案卷生命分布</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-600">履行中 ({activeCount})</span>
                                    <span className="text-gray-400">{totalCount ? Math.round(activeCount / totalCount * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalCount ? (activeCount / totalCount * 100) : 0}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-600">草稿与审签链 ({draftCount + processCount})</span>
                                    <span className="text-gray-400">{totalCount ? Math.round((draftCount + processCount) / totalCount * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${totalCount ? ((draftCount + processCount) / totalCount * 100) : 0}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-600">封卷结项 ({closedCount})</span>
                                    <span className="text-gray-400">{totalCount ? Math.round(closedCount / totalCount * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${totalCount ? (closedCount / totalCount * 100) : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 图表 2: 全局待办漏斗（简单模拟金三角差距） */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">款池转换漏斗</h3>
                        <div className="relative pt-2 pb-6">
                            <div className="w-full bg-gray-50 border border-gray-200 h-8 rounded mb-2 relative overflow-hidden flex items-center shadow-inner">
                                <div className="bg-blue-200 h-full absolute left-0" style={{ width: '100%' }}></div>
                                <span className="relative z-10 px-3 text-xs font-bold text-blue-900">计划下达基数 (100%)</span>
                            </div>
                            <div className="w-[85%] mx-auto bg-gray-50 border border-gray-200 h-8 rounded mb-2 relative overflow-hidden flex items-center shadow-inner">
                                <div className="bg-purple-200 h-full absolute left-0" style={{ width: `${globalPlannedSum ? Math.min((globalInvoiceSum / globalPlannedSum) * 100, 100) : 0}%` }}></div>
                                <span className="relative z-10 px-3 text-xs font-bold text-purple-900">法务票据输出</span>
                            </div>
                            <div className="w-[70%] mx-auto bg-gray-50 border border-gray-200 h-8 rounded relative overflow-hidden flex items-center shadow-inner">
                                <div className="bg-green-200 h-full absolute left-0" style={{ width: `${globalPlannedSum ? Math.min((globalReceiptSum / globalPlannedSum) * 100, 100) : 0}%` }}></div>
                                <span className="relative z-10 px-3 text-xs font-bold text-green-900">实打实现金回笼</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右侧：纵深高危穿透探针 */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mt-1">全局异常风险阻击中心</h3>
                    <p className="text-sm text-gray-500 mb-4">自下而上的各项目台账单链条汇聚警报，避免由于跨项目冲销而形成的盲区骗局。</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card A: 已票未收 */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-16 h-16 text-red-800" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="relative z-10">
                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold tracking-wider mb-2">最高爆破级 · 垫付预警</span>
                                <h4 className="text-gray-900 font-bold mb-1">全局 [已票 未收] 空单口径</h4>
                                <p className="text-4xl font-black text-red-600 mb-2 truncate" title={'￥' + totalInvoiceWithoutMoney.toLocaleString()}>￥{totalInvoiceWithoutMoney.toLocaleString()}</p>
                                <p className="text-xs text-red-800/80 leading-relaxed font-medium">极其恶劣的被掏空状态。这部分资金已作为销项向税局确认为企业收入，并需向其缴纳昂贵的增值税甚至附加税，但院方的对公户并未见到哪怕一分钱回款。属于替客户白垫资！</p>
                            </div>
                        </div>

                        {/* Card B: 已收未票 */}
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-16 h-16 text-yellow-800" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="relative z-10">
                                <span className="inline-block bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold tracking-wider mb-2">纠纷诉讼级 · 违约预警</span>
                                <h4 className="text-gray-900 font-bold mb-1">全局 [已收 未票] 索求口径</h4>
                                <p className="text-4xl font-black text-yellow-600 mb-2 truncate" title={'￥' + totalMoneyWithoutInvoice.toLocaleString()}>￥{totalMoneyWithoutInvoice.toLocaleString()}</p>
                                <p className="text-xs text-yellow-800/80 leading-relaxed font-medium">隐藏在水下的高压欠债。现金早就落入我们囊中，但在我们的开票库中查无同质等价的发票。这意味着我们在法理上始终欠着甲方一张发票，且在年底存在巨额税务调账和纠纷风险。</p>
                            </div>
                        </div>

                        {/* Card C: 逾期收款 */}
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition md:col-span-2">
                            <div className="flex justify-between items-center mb-4 border-b border-orange-200/50 pb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="inline-block bg-orange-200 text-orange-900 text-xs px-2 py-1 rounded-full font-bold tracking-wider">现金流断链 · 催收预装弹</span>
                                    <h4 className="text-gray-900 font-bold">全局计划 [超期] 违约池</h4>
                                </div>
                                <div>
                                    <Link href="/contract/ledger" className="text-xs font-bold text-orange-600 hover:text-orange-900 bg-white px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">深入排雷区 →</Link>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <p className="text-sm font-medium text-orange-800 mb-1">全院跨项目累计过期期次：</p>
                                    <p className="text-3xl font-black text-orange-600">{overduePlanCount} <span className="text-base font-bold text-orange-400">个烂账节点</span></p>
                                </div>
                                <div className="hidden sm:block w-px h-16 bg-orange-200"></div>
                                <div>
                                    <p className="text-sm font-medium text-orange-800 mb-1">总计搁浅的硬当资金：</p>
                                    <p className="text-3xl font-black text-orange-600 truncate" title={'￥' + overduePlanAmount.toLocaleString()}>￥{overduePlanAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
