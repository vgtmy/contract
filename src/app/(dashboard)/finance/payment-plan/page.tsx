'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { exportToExcel, PAYMENT_PLAN_EXPORT_COLUMNS } from '@/lib/excel-export';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    UNMET:    { label: '未到期', color: 'text-gray-500',   bg: 'bg-gray-100' },
    PENDING:  { label: '待收款', color: 'text-amber-600',  bg: 'bg-amber-50' },
    RECEIVED: { label: '已收款', color: 'text-emerald-600',bg: 'bg-emerald-50' },
    OVERDUE:  { label: '已逾期', color: 'text-rose-600',   bg: 'bg-rose-50' }
};

export default function PaymentPlanPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/finance/payment-plan?pageSize=9999');
            const json = await res.json();
            if (json.code === 200) {
                await exportToExcel(json.data.list, PAYMENT_PLAN_EXPORT_COLUMNS, '全院收款计划', '收款节点');
            }
        } catch(e: any) { alert('导出异常: ' + e.message); }
        finally { setExporting(false); }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = activeStatus
                ? `/api/finance/payment-plan?status=${activeStatus}`
                : '/api/finance/payment-plan';
            const res = await fetch(url);
            const json = await res.json();
            if (json.code === 200) setData(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = data?.stats || {};
    const totalExpected = Object.values(stats).reduce((sum: number, s: any) => sum + s.amount, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">全院收款计划</h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">监控所有合同的收款节点状态与预期现金流</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">计划总收款</div>
                        <div className="text-3xl font-black text-indigo-600">
                            ¥ {totalExpected.toLocaleString()}
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-5 py-3 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                        {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        <span>{exporting ? '导出中...' : '导出 Excel'}</span>
                    </button>
                </div>
            </div>


            {/* Status Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { key: '', label: '全部', icon: '📋' },
                    { key: 'PENDING',  label: '待收款', icon: '⏳' },
                    { key: 'OVERDUE',  label: '已逾期', icon: '🔴' },
                    { key: 'RECEIVED', label: '已收款', icon: '✅' },
                ].map(tab => {
                    const s = tab.key ? stats[tab.key] : { count: data?.total || 0, amount: totalExpected };
                    const isActive = activeStatus === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveStatus(tab.key)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                isActive
                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <div className="text-2xl mb-2">{tab.icon}</div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{tab.label}</div>
                            <div className="text-2xl font-black text-gray-900 mt-1">
                                ¥ {(s?.amount || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{s?.count || 0} 个节点</div>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">收款节点明细</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-300 animate-pulse font-black">数据加载中...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                {['合同信息', '甲方单位', '期次 / 条件', '计划金额', '实际到账', '预期日期', '状态'].map(h => (
                                    <th key={h} className="text-left text-xs font-black text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(data?.list || []).map((plan: any) => {
                                const s = STATUS_MAP[plan.status] || STATUS_MAP['UNMET'];
                                return (
                                    <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 text-sm">{plan.contract?.name}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{plan.contract?.serialNo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{plan.contract?.customer?.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-sm text-gray-800">{plan.phase}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 max-w-48 truncate" title={plan.condition}>{plan.condition}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-indigo-600">
                                                ¥ {Number(plan.expectedAmount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-black text-sm ${plan.actualAmount >= plan.expectedAmount ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                ¥ {Number(plan.actualAmount || 0).toLocaleString()}
                                            </div>
                                            {plan.receipts?.length > 0 && <div className="text-[10px] text-gray-400 mt-1 font-bold">由 {plan.receipts.length} 笔流水构成</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {plan.expectedDate ? new Date(plan.expectedDate).toLocaleDateString('zh-CN') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${s.bg} ${s.color}`}>
                                                {s.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(data?.list || []).length === 0 && (
                                <tr><td colSpan={6} className="text-center py-16 text-gray-300 font-black">暂无收款节点数据</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
