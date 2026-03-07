'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReceiptModal, ReceiptForm } from './ReceiptModal';

export const ReceiptList: React.FC<{ contractId: string, contractTotalAmount: number }> = ({ contractId, contractTotalAmount }) => {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]); // Derived only to populate the select in modal

    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ReceiptForm | null>(null);

    const fetchReceipts = useCallback(async () => {
        setLoading(true);
        setErrorStatus(false);
        try {
            const [recRes, planRes] = await Promise.all([
                fetch(`/api/biz/contract/${contractId}/receipt`),
                fetch(`/api/biz/contract/${contractId}/payment-plan`)
            ]);

            if (recRes.ok) {
                const json = await recRes.json();
                setReceipts(json.data || []);
            } else {
                setErrorStatus(true);
            }

            if (planRes.ok) {
                const pJson = await planRes.json();
                setPlans(pJson.data || []);
            }
        } catch (e) {
            setErrorStatus(true);
        } finally {
            setLoading(false);
        }
    }, [contractId]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const openNew = () => {
        setEditItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        const formatted: ReceiptForm = {
            id: item.id,
            planId: item.planId || '',
            amount: String(item.amount),
            receiptDate: item.receiptDate,
            paymentMethod: item.paymentMethod,
            voucherNo: item.voucherNo || '',
            remark: item.remark || ''
        };
        setEditItem(formatted);
        setIsModalOpen(true);
    };

    const handleDelete = async (receiptId: string) => {
        if (!confirm('冲红删账警告：流水将被连根拔掉且无法恢复！确认该笔流水属于录错需要冲毁吗？')) return;
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/receipt?receiptId=${receiptId}`, { method: 'DELETE' });
            if (res.ok) fetchReceipts();
            else alert('清除操作受阻');
        } catch (e) {
            alert('系统拦截，网络异常');
        }
    };

    const currentGatheredSum = receipts.reduce((acc, r) => acc + Number(r.amount), 0);
    const leftGatherAmount = contractTotalAmount - currentGatheredSum;
    const percentage = contractTotalAmount > 0 ? (currentGatheredSum / contractTotalAmount) * 100 : 0;

    const methodMap: Record<string, string> = {
        'BANK_TRANSFER': '银行电汇',
        'BILL_ACCEPTANCE': '承兑汇票',
        'CASH': '现金交收',
        'OTHER': '特批退回/其他'
    };

    if (errorStatus) return <div className="p-4 text-red-500 bg-red-50 rounded">票款流水库读取溃缩。</div>;

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 mt-6">
            <div className="px-4 py-5 sm:px-6 bg-green-50 flex justify-between items-center border-b border-green-100">
                <div>
                    <h3 className="text-lg leading-6 font-bold text-green-900">对公户实收流水</h3>
                    <p className="mt-1 text-sm text-green-700">监控甲方真金白银的回款。禁止入账规模超越签订的总合同额。</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                    + 登记首笔/追加款项
                </button>
            </div>

            <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="w-2/3 pr-8">
                    <div className="flex justify-between text-sm mb-1 font-medium">
                        <span className="text-green-700">资金池实增: ￥{currentGatheredSum.toLocaleString()}</span>
                        <span className="text-gray-500">待收开口: ￥{leftGatherAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            <div>
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">核兑流转账单...</div>
                ) : receipts.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                        <svg className="h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>暂无任何到账确权数字。此履约口处于完全空账。</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">到账日</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">注入提纲 (对应节点)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">通道与票据号</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">实收发生额</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {receipts.map(r => (
                                    <tr key={r.id} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {new Date(r.receiptDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {r.plan?.phase ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    销账节点: {r.plan.phase}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">直扣 (无显式挂点)</span>
                                            )}
                                            {r.remark && <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={r.remark}>{r.remark}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 text-xs">
                                                {methodMap[r.paymentMethod] || '规避分类'}
                                            </span>
                                            <br />
                                            <span className="text-xs font-mono mt-1 inline-block text-gray-400 tracking-widest">{r.voucherNo || '-- 无填单 --'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700">
                                            + ￥{Number(r.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-900">修偏</button>
                                            <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-900">退散</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ReceiptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchReceipts}
                editData={editItem}
                contractId={contractId}
                paymentPlans={plans}
            />
        </div>
    );
};
