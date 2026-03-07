'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StatusTag } from '@/components/common/StatusTag';
import { PaymentPlanModal, PaymentPlanForm } from './PaymentPlanModal';

export const PaymentPlanList: React.FC<{ contractId: string, contractTotalAmount: number }> = ({ contractId, contractTotalAmount }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<PaymentPlanForm | null>(null);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setErrorStatus(false);
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/payment-plan`);
            if (res.ok) {
                const json = await res.json();
                setPlans(json.data || []);
            } else {
                setErrorStatus(true);
            }
        } catch (e) {
            setErrorStatus(true);
        } finally {
            setLoading(false);
        }
    }, [contractId]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const openNew = () => {
        setEditItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (planId: string) => {
        if (!confirm('确认要移除该期次的收款计划吗？系统本版本尚未接入收发票限制判断。')) return;
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/payment-plan?planId=${planId}`, { method: 'DELETE' });
            if (res.ok) fetchPlans();
            else alert('移除失败');
        } catch (e) {
            alert('系统拦截，网络异常');
        }
    };

    const currentPlannedSum = plans.reduce((acc, p) => acc + Number(p.expectedAmount), 0);
    const leftAmount = contractTotalAmount - currentPlannedSum;

    // Renders the percentage progress bar of how much amount is planned
    const percentage = contractTotalAmount > 0 ? (currentPlannedSum / contractTotalAmount) * 100 : 0;

    if (errorStatus) return <div className="p-4 text-red-500 bg-red-50 rounded">计划数据流读取失败。</div>;

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">

            {/* Header & Dashboard Stats */}
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center border-b border-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">财务视图：分解收款计划池</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">此模块监控应收账款预期时间轴。严禁所有期次总额溢出所签合同总金额。</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    + 强行插入期次
                </button>
            </div>

            <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                <div className="w-2/3 pr-8">
                    <div className="flex justify-between text-sm mb-1 font-medium">
                        <span className="text-indigo-800">已部署计划资金: ￥{currentPlannedSum.toLocaleString()}</span>
                        <span className="text-gray-500">剩余未规划: ￥{leftAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${percentage > 100 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                </div>
                <div className="text-right flex-1">
                    <p className="text-xs text-gray-500">协议基准定额</p>
                    <p className="text-lg font-bold text-gray-900">￥{contractTotalAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* Main List */}
            <div>
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">正在检索财务资金池...</div>
                ) : plans.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 border-dashed border-2 border-gray-100 mx-4 my-4 rounded-lg">
                        <svg className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <p>当前全空白，请向中心化资金池划拨第一笔入账规划。</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {plans.map((p, idx) => (
                            <li key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mr-3">
                                                {idx + 1}
                                            </span>
                                            <h4 className="text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 pb-0.5">{p.phase}</h4>
                                            <span className="ml-4 font-mono text-gray-500 text-sm">
                                                {p.expectedDate ? new Date(p.expectedDate).toLocaleDateString() : '未锁定期限'}
                                            </span>
                                            <div className="ml-4">
                                                {p.status === 'UNMET' && <StatusTag type="default" text="尚未爆雷达标" />}
                                                {p.status === 'PENDING' && <StatusTag type="processing" text="发票开出待收" />}
                                                {p.status === 'RECEIVED' && <StatusTag type="success" text="实收核销对账" />}
                                                {p.status === 'OVERDUE' && <StatusTag type="error" text="风险预警" />}
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600 pl-9">
                                            <span className="text-gray-400 mr-2">里程碑判定:</span>
                                            {p.condition || '无特殊考核说明'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end pl-8 border-l border-gray-100">
                                        <span className="text-lg font-bold text-green-700">￥{Number(p.expectedAmount).toLocaleString()}</span>
                                        <div className="mt-2 text-sm space-x-3">
                                            <button onClick={() => openEdit(p)} className="text-indigo-600 hover:underline">变更指令</button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">拆除节点</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <PaymentPlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPlans}
                editData={editItem}
                contractId={contractId}
            />
        </div>
    );
};
