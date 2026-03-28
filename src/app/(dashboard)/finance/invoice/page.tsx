'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { exportToExcel, RECEIPT_EXPORT_COLUMNS } from '@/lib/excel-export';

const INVOICE_TYPE_MAP: Record<string, string> = {
    VAT_SPECIAL:  '增值税专用发票',
    VAT_ORDINARY: '增值税普通发票',
    RECEIPT:      '收据'
};

export default function InvoicePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState({ total: 0, totalBilled: 0, totalTax: 0 });
    const [exporting, setExporting] = useState(false);

    const [form, setForm] = useState({
        contractId: '',
        invoiceNo: '',
        invoiceType: 'VAT_SPECIAL',
        amountAmount: '',
        taxRate: '6',
        billingDate: new Date().toISOString().split('T')[0],
        title: '',
        remark: ''
    });

    const computedTax = form.amountAmount
        ? (parseFloat(form.amountAmount) * (parseFloat(form.taxRate) / (100 + parseFloat(form.taxRate)))).toFixed(2)
        : '0.00';

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/invoice/list');
            const json = await res.json();
            if (json.code === 200) {
                setRecords(json.data.list);
                setSummary({
                    total: json.data.total,
                    totalBilled: json.data.totalBilled,
                    totalTax: json.data.totalTax
                });
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

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/finance/invoice/list?pageSize=9999');
            const json = await res.json();
            if (json.code === 200) {
                // 因为没有专门的 INVOICE_EXPORT_COLUMNS，暂时借用 RECEIPT_EXPORT_COLUMNS 或后续补充
                // 基于 InvoiceRecord 数据结构，我们应该有自己的列定义
                await exportToExcel(json.data.list, [
                    { key: 'contractSerial', header: '合同编号', width: 16, formatter: (_, row) => row.contract?.serialNo },
                    { key: 'contractName',   header: '合同名称', width: 36, formatter: (_, row) => row.contract?.name },
                    { key: 'invoiceNo',      header: '发票号码', width: 20 },
                    { key: 'invoiceType',    header: '发票类型', width: 20, formatter: (v) => INVOICE_TYPE_MAP[String(v)] || String(v) },
                    { key: 'amountAmount',   header: '开票金额(元)', width: 16, formatter: (v) => Number(v) },
                    { key: 'taxAmount',      header: '税额(元)', width: 16, formatter: (v) => Number(v) },
                    { key: 'billingDate',    header: '开票日期', width: 16, formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
                    { key: 'title',          header: '发票抬头', width: 30 },
                ], '发票开具流水', '发票台账');
            }
        } catch(e: any) { alert('导出异常: ' + e.message); }
        finally { setExporting(false); }
    };

    useEffect(() => { fetchRecords(); fetchContracts(); }, [fetchRecords, fetchContracts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/finance/invoice/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.code === 200) {
                alert('发票记录登记成功！');
                setShowForm(false);
                setForm({ contractId: '', invoiceNo: '', invoiceType: 'VAT_SPECIAL', amountAmount: '', taxRate: '6', billingDate: new Date().toISOString().split('T')[0], title: '', remark: '' });
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">发票开具流水</h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">登记发票信息，自动计算税额，关联合同主体</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right">
                        <div className="text-xs font-black text-gray-400 uppercase">累计开票</div>
                        <div className="text-2xl font-black text-violet-600">¥ {summary.totalBilled.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-black text-gray-400 uppercase">累计税额</div>
                        <div className="text-lg font-black text-orange-500">¥ {summary.totalTax.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-5 py-3 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                        {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        <span>{exporting ? '导出中...' : '导出 Excel'}</span>
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-violet-600 text-white text-sm font-black rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all"
                    >
                        + 登记发票
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900">登记开票记录</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">关联合同 *</label>
                                    <select
                                        value={form.contractId}
                                        onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))}
                                        required
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:bg-white transition-all font-medium"
                                    >
                                        <option value="">请选择合同...</option>
                                        {contracts.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.serialNo} | {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">发票号码 *</label>
                                    <input type="text" required value={form.invoiceNo}
                                        onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                                        placeholder="FP-2026-0001"
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl font-mono text-sm border-transparent focus:border-violet-500 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">发票类型</label>
                                    <select value={form.invoiceType} onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value }))}
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:bg-white transition-all font-medium">
                                        {Object.entries(INVOICE_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">开票总金额 (含税) *</label>
                                    <input type="number" required value={form.amountAmount}
                                        onChange={e => setForm(f => ({ ...f, amountAmount: e.target.value }))}
                                        placeholder="0.00"
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl font-black text-violet-600 border-transparent focus:border-violet-500 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">税率 (%)</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <select value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:bg-white transition-all font-bold">
                                            {['3', '6', '9', '13'].map(r => <option key={r} value={r}>{r}%</option>)}
                                        </select>
                                    </div>
                                    {form.amountAmount && (
                                        <div className="text-xs text-orange-500 font-bold mt-1">
                                            → 税额约 ¥ {computedTax}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">开票日期 *</label>
                                    <input type="date" required value={form.billingDate}
                                        onChange={e => setForm(f => ({ ...f, billingDate: e.target.value }))}
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:bg-white transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase">发票抬头</label>
                                    <input type="text" value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="默认使用合同甲方名称"
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:bg-white transition-all text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">摘要备注</label>
                                    <textarea rows={2} value={form.remark}
                                        onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
                                        placeholder="开票摘要或说明..."
                                        className="mt-1 w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:border-violet-500 focus:bg-white transition-all text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all">取消</button>
                                <button type="submit" disabled={submitting} className="px-8 py-3 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50">
                                    {submitting ? '登记中...' : '确认登记'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">发票台账</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-300 animate-pulse font-black">数据加载中...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                {['合同信息', '甲方单位', '发票号码', '类型', '开票金额', '税额', '开票日期'].map(h => (
                                    <th key={h} className="text-left text-xs font-black text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.map((r: any) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm">{r.contract?.name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{r.contract?.serialNo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{r.contract?.customer?.name}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{r.invoiceNo}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{INVOICE_TYPE_MAP[r.invoiceType] || r.invoiceType}</td>
                                    <td className="px-6 py-4 font-black text-violet-600">¥ {Number(r.amountAmount).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-orange-500 font-bold">¥ {Number(r.taxAmount).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                        {new Date(r.billingDate).toLocaleDateString('zh-CN')}
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-16 text-gray-300 font-black">暂无发票记录，点击上方"登记发票"开始录入</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
