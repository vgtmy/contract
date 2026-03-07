'use client';

import React from 'react';

interface TriangleSummaryProps {
    totalAmount: number;         // 1. 合同总金额
    plannedAmount: number;       // 2. 收款计划总额
    actualReceivedAmount: number; // 3. 已收款总额
    invoicedAmount: number;      // 4. 已开票总额
}

export const TriangleSummaryPanel: React.FC<TriangleSummaryProps> = ({
    totalAmount,
    plannedAmount,
    actualReceivedAmount,
    invoicedAmount
}) => {
    // --- 计算口径说明 ---
    // A. 待回款(未收款)：总签单额 - 真金白银已收。不探讨应收，只探讨物理缺口。
    const unreceivedAmount = Math.max(totalAmount - actualReceivedAmount, 0);

    // B. 未开票池余量：总签单额 - 已开出去的票。衡量还能为甲方提供多少开票额度。
    const uninvoicedAmount = Math.max(totalAmount - invoicedAmount, 0);

    // C. 高危风险：已收未票 (预收账款池/欠客票)。钱到了但没给甲方票，甲方随时会来讨债。
    const moneyWithoutInvoice = Math.max(actualReceivedAmount - invoicedAmount, 0);

    // D. 极危风险：已票未收 (垫税/空头票)。票开走了，但钱没回来。公司倒贴增值税和所得税。
    const invoiceWithoutMoney = Math.max(invoicedAmount - actualReceivedAmount, 0);

    // --- 进度防爆基数 ---
    const receivePercent = totalAmount > 0 ? Math.min((actualReceivedAmount / totalAmount) * 100, 100) : 0;
    const invoicePercent = totalAmount > 0 ? Math.min((invoicedAmount / totalAmount) * 100, 100) : 0;
    const planPercent = totalAmount > 0 ? Math.min((plannedAmount / totalAmount) * 100, 100) : 0;

    return (
        <div className="bg-white px-6 py-5 shadow sm:rounded-lg border border-gray-200 mb-6">
            <h3 className="text-base leading-6 font-bold text-gray-900 border-b pb-3 mb-4">业财税核算仪表 (金三角分析)</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Column 1: 基石 - 合同总额与计划流 */}
                <div className="space-y-4 border-r pr-6 border-dashed">
                    <div>
                        <p className="text-xs text-gray-400 font-medium tracking-wider mb-1 uppercase">基础签单盘 (元)</p>
                        <p className="text-2xl font-black text-gray-800">￥{totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">已部署计划口径</span>
                            <span className="font-bold text-blue-600">￥{plannedAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-300 h-1.5 rounded-full" style={{ width: `${planPercent}%` }}></div>
                        </div>
                        {plannedAmount > totalAmount && <p className="text-xs text-red-500 mt-1">⚠️ 计划部署额异常溢出</p>}
                    </div>
                </div>

                {/* Column 2: 现金池 - 收款进度 */}
                <div className="space-y-4 border-r pr-6 border-dashed">
                    <div>
                        <p className="text-xs text-green-600 font-bold tracking-wider mb-1 uppercase">物理落袋款 (累计实收)</p>
                        <p className="text-2xl font-black text-green-700">￥{actualReceivedAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">剩余缺口: ￥{unreceivedAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">真金白银回款率</span>
                            <span className="font-bold text-green-600">{receivePercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${receivePercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Column 3: 票据池 - 开票进度 */}
                <div className="space-y-4 border-r pr-6 border-dashed">
                    <div>
                        <p className="text-xs text-purple-600 font-bold tracking-wider mb-1 uppercase">合规销项 (累计开出)</p>
                        <p className="text-2xl font-black text-purple-700">￥{invoicedAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">剩余可用额度: ￥{uninvoicedAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">开票挤占率</span>
                            <span className="font-bold text-purple-600">{invoicePercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${invoicePercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Column 4: 风险诊断舱 */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col justify-center">
                    <p className="text-xs text-gray-500 font-bold mb-3 border-b pb-2 uppercase text-center tracking-widest">交叉风控体检室</p>

                    <div className="space-y-3">
                        {/* Rule 1: 已票未收 (垫税黑洞) - 最致命 */}
                        {invoiceWithoutMoney > 0 ? (
                            <div className="bg-red-50 border border-red-200 rounded p-2 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                <p className="text-xs text-red-600 font-bold ml-1">高危：已票未收 (垫税垫资)</p>
                                <p className="text-sm font-black text-red-700 ml-1 mt-0.5">￥{invoiceWithoutMoney.toLocaleString()}</p>
                                <p className="text-[10px] text-red-400 ml-1 mt-1 leading-tight">发票已离手但钱没汇入，税务确权产生垫金黑洞，需立即催收。</p>
                            </div>
                        ) : (
                            <div className="flex items-center text-xs text-green-600 font-medium py-1">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                无垫票黑洞风险
                            </div>
                        )}

                        {/* Rule 2: 已收未票 (履约负债) - 次生负债 */}
                        {moneyWithoutInvoice > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                                <p className="text-xs text-yellow-700 font-bold ml-1">次危：已收未票 (隐形负债)</p>
                                <p className="text-sm font-black text-yellow-800 ml-1 mt-0.5">￥{moneyWithoutInvoice.toLocaleString()}</p>
                                <p className="text-[10px] text-yellow-600 ml-1 mt-1 leading-tight">钱已入账但对应面额的票尚未开具交差。存在被讨票风险。</p>
                            </div>
                        ) : (
                            <div className="flex items-center text-xs text-green-600 font-medium py-1">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                无积压欠客票面
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
