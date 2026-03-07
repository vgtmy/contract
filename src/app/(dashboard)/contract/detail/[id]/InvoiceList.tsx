'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceModal, InvoiceForm } from './InvoiceModal';

export const InvoiceList: React.FC<{
    contractId: string,
    contractTotalAmount: number,
    defaultTitle?: string,
    defaultTaxRate?: string
}> = ({ contractId, contractTotalAmount, defaultTitle, defaultTaxRate }) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InvoiceForm | null>(null);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setErrorStatus(false);
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/invoice`);
            if (res.ok) {
                const json = await res.json();
                setInvoices(json.data || []);
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
        fetchInvoices();
    }, [fetchInvoices]);

    const openNew = () => {
        setEditItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        const formatted: InvoiceForm = {
            id: item.id,
            invoiceNo: item.invoiceNo,
            invoiceType: item.invoiceType,
            amountAmount: String(item.amountAmount),
            taxRate: String(item.taxRate),
            billingDate: item.billingDate,
            title: item.title || '',
            remark: item.remark || ''
        };
        setEditItem(formatted);
        setIsModalOpen(true);
    };

    const handleDelete = async (invoiceId: string) => {
        if (!confirm('作废/红冲 警告：是否确定要撤回该笔开票记录？系统底层防伪核算将回退。')) return;
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/invoice?invoiceId=${invoiceId}`, { method: 'DELETE' });
            if (res.ok) fetchInvoices();
            else alert('撤回操作受阻');
        } catch (e) {
            alert('系统拦截，网络异常');
        }
    };

    const currentGatheredSum = invoices.reduce((acc, inv) => acc + Number(inv.amountAmount), 0);
    const leftGatherAmount = contractTotalAmount - currentGatheredSum;
    const percentage = contractTotalAmount > 0 ? (currentGatheredSum / contractTotalAmount) * 100 : 0;

    const totalCalculatedTax = invoices.reduce((acc, inv) => acc + Number(inv.taxAmount), 0);

    const typeMap: Record<string, string> = {
        'VAT_SPECIAL': '增值专票',
        'VAT_ORDINARY': '增值普票',
        'E_INVOICE': '电子发票',
        'RECEIPT': '无税收据'
    };

    if (errorStatus) return <div className="p-4 text-red-500 bg-red-50 rounded mt-6">票据数据检索中断。</div>;

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 mt-6">
            <div className="px-4 py-5 sm:px-6 bg-indigo-50 flex justify-between items-center border-b border-indigo-100">
                <div>
                    <h3 className="text-lg leading-6 font-bold text-indigo-900">涉税开票管理簿</h3>
                    <p className="mt-1 text-sm text-indigo-700">确保“业财税”一体合规，监控外开单张税赋。严禁越权无源多开。</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    + 外包新开 / 追加登记
                </button>
            </div>

            <div className="bg-white px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-2/3 pr-8">
                    <div className="flex justify-between text-sm mb-1 font-medium">
                        <span className="text-indigo-700">合法开出总量: ￥{currentGatheredSum.toLocaleString()}</span>
                        <span className="text-gray-500">剩余合规开票口径: ￥{leftGatherAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                </div>
                <div className="w-full md:w-1/3 flex justify-end md:border-l md:pl-6 border-gray-200">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">销项税累积估算预备槽</p>
                        <p className="text-xl font-black text-red-500">￥{totalCalculatedTax.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div>
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">穿透读取票根...</div>
                ) : invoices.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                        <svg className="h-8 w-8 text-indigo-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p>该履约带尚未外包输出过任何发票。属于潜伏态。</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">打印出票日</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">实体票控防伪追踪</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">税率及拆解</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">价税合计流出金额</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">控制面</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {new Date(inv.billingDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {inv.invoiceNo}
                                            </span>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">{typeMap[inv.invoiceType]}</span>
                                                {inv.title && <span className="text-xs text-gray-500 truncate max-w-[150px]" title={inv.title}>{inv.title}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <p>征赋: <strong className="text-gray-700">{Number(inv.taxRate)}%</strong></p>
                                            <p className="text-xs text-red-500 mt-1">含税金: ￥{Number(inv.taxAmount).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                            - ￥{Number(inv.amountAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => openEdit(inv)} className="text-blue-600 hover:text-blue-900">补正</button>
                                            <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-900">红冲消亡</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <InvoiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchInvoices}
                editData={editItem}
                contractId={contractId}
                defaultTitle={defaultTitle}
                defaultTaxRate={defaultTaxRate}
            />
        </div>
    );
};
