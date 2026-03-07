import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { StatusTag } from '@/components/common/StatusTag';
import { PaymentPlanList } from './PaymentPlanList';
import { ContractAttachmentList } from './ContractAttachmentList';
import { ReceiptList } from './ReceiptList';
import { InvoiceList } from './InvoiceList';
import { TriangleSummaryPanel } from './TriangleSummaryPanel';

export default async function ContractDetailPage({
    params
}: {
    params: { id: string }
}) {
    const { id } = await params;

    // Render direct from DB in RSC
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
            customer: true,
            project: true,
            paymentPlans: { select: { expectedAmount: true } },
            receipts: { select: { amount: true } },
            invoices: { select: { amountAmount: true } }
        }
    });

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-gray-700">找不到该合同档案</h2>
                <Link href="/contract/ledger" className="mt-4 text-blue-600 underline">返回台账列表</Link>
            </div>
        );
    }

    const statusMap: Record<string, { type: 'default' | 'success' | 'warning' | 'processing' | 'error', text: string }> = {
        DRAFT: { type: 'default', text: '草拟录入' },
        PROCESS: { type: 'processing', text: '审批流转中' },
        ACTIVE: { type: 'success', text: '盖章生效 (履行中)' },
        CLOSED: { type: 'warning', text: '结项已归档' }
    };

    const statusDisplay = statusMap[contract.status] || statusMap['DRAFT'];

    // --- 仪表盘核心底座：服务端下推聚合测算 ---
    const totalAmount = Number(contract.totalAmount);
    const plannedSum = contract.paymentPlans.reduce((acc: number, p: any) => acc + Number(p.expectedAmount), 0);
    const receiptSum = contract.receipts.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
    const invoiceSum = contract.invoices.reduce((acc: number, i: any) => acc + Number(i.amountAmount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/contract/ledger" className="text-gray-500 hover:text-gray-800 font-medium">
                    ← 返回台账
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">
                    合同：{contract.name}
                </h1>
                <div className="ml-4">
                    <StatusTag type={statusDisplay.type} text={statusDisplay.text} />
                </div>
            </div>

            {/* Sprint 4 收尾：业财金三角监控卡片 */}
            <TriangleSummaryPanel
                totalAmount={totalAmount}
                plannedAmount={plannedSum}
                actualReceivedAmount={receiptSum}
                invoicedAmount={invoiceSum}
            />

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">核心履约要素</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">本页目前为最小可用展示闭环，包含合同标的及权属分离基础信息。</p>
                    </div>
                </div>

                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">流水编号 (系统唯一)</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded">
                                {contract.serialNo}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">合同交易总额</dt>
                            <dd className="mt-1 text-lg font-bold text-blue-700 sm:mt-0 sm:col-span-2">
                                ￥{Number(contract.totalAmount).toLocaleString()} 元 <span className="text-sm font-normal text-gray-500 ml-4">(税率: {Number(contract.taxRate)})%</span>
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">关联客商 (甲方)</dt>
                            <dd className="mt-1 text-sm text-blue-600 hover:underline sm:mt-0 sm:col-span-2">
                                <Link href={`/customer/detail/${contract.customerId}`}>
                                    {contract.customer?.name}
                                </Link>
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">签约周期</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex space-x-6">
                                <span><span className="text-gray-400 mr-2">签订落款：</span>{contract.signDate ? contract.signDate.toLocaleDateString() : '-'}</span>
                                <span><span className="text-gray-400 mr-2">生效起期：</span>{contract.startDate ? contract.startDate.toLocaleDateString() : '-'}</span>
                                <span><span className="text-gray-400 mr-2">履行止期：</span>{contract.endDate ? contract.endDate.toLocaleDateString() : '-'}</span>
                            </dd>
                        </div>

                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-t border-dashed border-gray-200 mt-4">
                            <dt className="text-sm font-medium text-gray-500">数据权限归属</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                                <span className="mr-6 font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded">所属部门：{contract.deptName}</span>
                                <span className="mr-6 font-medium bg-green-50 text-green-700 px-2 py-1 rounded">实际跟进PM：{contract.pmName}</span>
                                <span className="font-medium bg-gray-50 text-gray-700 px-2 py-1 rounded">关联立项基准：{contract.project?.name || '-'}</span>
                            </dd>
                        </div>
                        {contract.remark && (
                            <div className="bg-yellow-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-yellow-800">条款/审批特注</dt>
                                <dd className="mt-1 text-sm text-yellow-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                                    {contract.remark}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 items-start">
                <div className="w-full">
                    <PaymentPlanList contractId={contract.id} contractTotalAmount={Number(contract.totalAmount)} />
                </div>
                <div className="w-full xl:h-full min-h-[400px]">
                    <ContractAttachmentList contractId={contract.id} />
                </div>
            </div>

            {/* 实收款流水(Sprint 4) 全宽展示 */}
            <div className="mt-6 w-full">
                <ReceiptList contractId={contract.id} contractTotalAmount={Number(contract.totalAmount)} />
            </div>

            {/* 开票流控制(Sprint 4) 全宽展示 */}
            <div className="mt-6 w-full pb-10">
                <InvoiceList
                    contractId={contract.id}
                    contractTotalAmount={Number(contract.totalAmount)}
                    defaultTitle={contract.customer.name}
                    defaultTaxRate={contract.taxRate ? String(contract.taxRate) : '6'}
                />
            </div>

        </div>
    );
}
