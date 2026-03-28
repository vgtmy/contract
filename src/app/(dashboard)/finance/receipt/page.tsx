'use client';

import React, { useState, useEffect, useCallback } from 'react';

const METHOD_MAP: Record<string, string> = {
    BANK_TRANSFER: '银行转账',
    ACCEPTANCE:    '承兑汇票',
    CASH:          '现金',
    OTHER:         '其他'
};

export default function ReceiptPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);

    const [form, setForm] = useState({
        contractId: '',
        planId: '',
        amount: '',
        receiptDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        voucherNo: '',
        remark: ''
    });

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/receipt/list');
            const json = await res.json();
            if (json.code === 200) {
                setRecords(json.data.list);
                setTotalAmount(json.data.totalAmount);
            }
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const fetchContracts = useCallback(async () => {
        try {
            const res = await fetch('/api/contract/list?pageSize=9999');
            const json = await res.json();
            if (json.code === 200) setContracts(json.data.list || []);
        } catch(e) { console.error(e); }
    }, []);


    useEffect(() => { fetchRecords(); fetchContracts(); }, [fetchRecords, fetchContracts]);

    // 当选择合同时，加载该合同的收款计划
    const handleContractChange = async (contractId: string) => {
        setForm(f => ({ ...f, contractId, planId: '' }));
        if (!contractId) { setPlans([]); return; }
        try {
            const res = await fetch(`/api/finance/payment-plan?contractId=${contractId}&pageSize=50`);
            const json = await res.json();
            if (json.code === 200) setPlans(json.data.list.filter((p: any) => p.contractId === contractId));
        } catch(e) { setPlans([]); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.contractId || !form.amount || !form.receiptDate) {
            alert('请填写必填项：合同、金额、收款日期');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/finance/receipt/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.code === 200) {
                alert('收款记录登记成功！');
                setShowForm(false);
                setForm({ contractId: '', planId: '', amount: '', receiptDate: new Date().toISOString().split('T')[0], paymentMethod: 'BANK_TRANSFER', voucherNo: '', remark: '' });
                fetchRecords();
            } else {
                alert('登记失败: ' + json.message);
            }
        } catch(e) { alert('服务器异常'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">进账认款登记</h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">登记银行到账记录，关联合同收款节点</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-xs font-black text-gray-400 uppercase">已入账总额</div>
                        <div className="text-2xl font-black text-emerald-600">¥ {totalAmount.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                        + 登记到账
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900">登记收款记录</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">关联合同 *</label>
                                    <select
                                        value={form.contractId}
                                        onChange={e => handleContractChange(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all font-medium"
                                    >
                                        <option value="">请选择合同...</option>
                                        {contracts.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.serialNo} | {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {plans.length > 0 && (
                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-gray-400 uppercase">关联收款节点（选填）</label>
                                        <select
                                            value={form.planId}
                                            onChange={e => setForm(f => ({ ...f, planId: e.target.value }))}
                                            className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all font-medium"
                                        >
                                            <option value="">— 不指定节点 —</option>
                                            {plans.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.phase} · ¥{Number(p.expectedAmount).toLocaleString()} · {p.status}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">到账金额 (元) *</label>
                                    <input
                                        type="number" required
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="0.00"
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl font-black text-emerald-600 border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">到账日期 *</label>
                                    <input
                                        type="date" required
                                        value={form.receiptDate}
                                        onChange={e => setForm(f => ({ ...f, receiptDate: e.target.value }))}
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">收款方式</label>
                                    <select
                                        value={form.paymentMethod}
                                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold"
                                    >
                                        {Object.entries(METHOD_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">凭证号</label>
                                    <input
                                        type="text"
                                        value={form.voucherNo}
                                        onChange={e => setForm(f => ({ ...f, voucherNo: e.target.value }))}
                                        placeholder="银行流水号或凭证编号"
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:bg-white transition-all font-mono text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">备注说明</label>
                                    <textarea
                                        rows={2}
                                        value={form.remark}
                                        onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
                                        placeholder="到账说明或备注..."
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-emerald-500 focus:bg-white transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all">取消</button>
                                <button type="submit" disabled={submitting} className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50">
                                    {submitting ? '登记中...' : '确认登记'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">到账流水记录</h2>
                    <span className="text-xs font-bold text-gray-400">{records.length} 条记录</span>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-300 animate-pulse font-black">数据加载中...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                {['合同信息', '甲方单位', '关联节点', '到账金额', '到账日期', '收款方式', '凭证号'].map(h => (
                                    <th key={h} className="text-left text-xs font-black text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.map((r: any) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm">{r.contract?.name}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{r.contract?.serialNo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{r.contract?.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.plan?.phase || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-emerald-600">¥ {Number(r.amount).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                        {new Date(r.receiptDate).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{METHOD_MAP[r.paymentMethod] || r.paymentMethod}</td>
                                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">{r.voucherNo || '—'}</td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-16 text-gray-300 font-black">暂无收款记录，点击上方"登记到账"开始录入</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
