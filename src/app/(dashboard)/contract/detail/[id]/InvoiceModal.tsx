'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';

export interface InvoiceForm {
    id?: string;
    invoiceNo: string;
    invoiceType: string;
    amountAmount: string; // 含税总价
    taxRate: string;      // 税率
    billingDate: string;
    title: string;
    remark: string;
}

const defaultForm: InvoiceForm = {
    invoiceNo: '',
    invoiceType: 'VAT_SPECIAL',
    amountAmount: '',
    taxRate: '6', // 默认典型的工程/服务税率6%
    billingDate: new Date().toISOString().split('T')[0],
    title: '',
    remark: ''
};

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: InvoiceForm | null;
    contractId: string;
    defaultTitle?: string; // 默认带出客户名称
    defaultTaxRate?: string; // 从合同带出的基准税率
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
    isOpen, onClose, onSuccess, editData, contractId, defaultTitle, defaultTaxRate
}) => {
    const [formData, setFormData] = useState<InvoiceForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Auto-calculated computed values for real-time display
    const [computedTax, setComputedTax] = useState(0);
    const [computedNoTax, setComputedNoTax] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const formatted = { ...editData };
                if (formatted.billingDate) formatted.billingDate = formatted.billingDate.split('T')[0];
                setFormData(formatted);
            } else {
                setFormData({
                    ...defaultForm,
                    title: defaultTitle || '',
                    taxRate: defaultTaxRate ? String(defaultTaxRate) : '6'
                });
            }
            setErrorMsg('');
        }
    }, [isOpen, editData, defaultTitle, defaultTaxRate]);

    useEffect(() => {
        // Recalculate preview amounts whenever main inputs change
        const amt = parseFloat(formData.amountAmount);
        const rate = parseFloat(formData.taxRate) || 0;
        if (!isNaN(amt) && amt > 0) {
            const tax = amt / (1 + (rate / 100)) * (rate / 100);
            setComputedTax(Math.round(tax * 100) / 100);
            setComputedNoTax(Math.round((amt - tax) * 100) / 100);
        } else {
            setComputedTax(0);
            setComputedNoTax(0);
        }
    }, [formData.amountAmount, formData.taxRate]);

    const handleSubmit = async () => {
        if (!formData.invoiceNo.trim()) {
            setErrorMsg('必须提供发票防伪票号等检索依据。');
            return;
        }
        const amountNum = parseFloat(formData.amountAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMsg('请填写合规的正数总金额。');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const isEdit = !!formData.id;
            const res = await fetch(`/api/biz/contract/${contractId}/invoice`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.code === 200) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(data.message || '系统录入拦截异常。');
            }
        } catch (err) {
            setErrorMsg('网络阻断，请重试');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <button onClick={onClose} disabled={loading} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消返回
            </button>
            <button onClick={handleSubmit} disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {loading ? '风控核算中...' : '确认开出落档'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "重定已开票卷宗" : "宣告开具外发的增值税发票"}
            width="lg"
            footer={footer}
        >
            <div className="space-y-4">
                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                        {errorMsg}
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">真伪字轨 / 票控号码 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={formData.invoiceNo}
                            onChange={e => setFormData({ ...formData, invoiceNo: e.target.value })}
                            placeholder="录入防伪号段"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm font-mono text-indigo-700"
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">税制分类</label>
                        <select
                            value={formData.invoiceType}
                            onChange={e => setFormData({ ...formData, invoiceType: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 bg-white"
                        >
                            <option value="VAT_SPECIAL">增值税专用发票 (可抵扣)</option>
                            <option value="VAT_ORDINARY">增值税普通发票</option>
                            <option value="E_INVOICE">电子普通发票</option>
                            <option value="RECEIPT">不可抵扣收据</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">开具明示抬头</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="发票上打印的公司名称"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm bg-gray-50"
                    />
                </div>

                <div className="flex gap-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                    <div className="w-1/2">
                        <label className="block text-sm font-bold text-indigo-900 mb-1">价税合计总额 (￥) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            value={formData.amountAmount}
                            onChange={e => setFormData({ ...formData, amountAmount: e.target.value })}
                            placeholder="0.00"
                            className="block w-full px-3 py-2 rounded-md border border-indigo-300 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-bold text-indigo-700"
                        />
                    </div>
                    <div className="w-1/4">
                        <label className="block text-sm font-bold text-indigo-900 mb-1">现用税率 (%)</label>
                        <input
                            type="number"
                            value={formData.taxRate}
                            onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                            className="block w-full px-3 py-2 rounded-md border border-indigo-300 focus:ring-indigo-500 text-lg font-bold text-center"
                        />
                    </div>

                    {/* Live Calculation Preview */}
                    <div className="absolute right-[-1px] top-full mt-2 bg-white border border-gray-200 shadow-lg rounded-md p-3 text-sm z-10 w-[300px]">
                        <div className="flex justify-between text-gray-600 mb-1">
                            <span>演算原价 (不含税)：</span>
                            <span className="font-medium">￥{computedNoTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600 font-medium">
                            <span>剥离计核税额：</span>
                            <span>￥{computedTax.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 border-t pt-2">系统在落盘时将永久固化该笔换算税额，用于年底应交增值税总和预估。</div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700">实际开具签发日 <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            value={formData.billingDate}
                            onChange={e => setFormData({ ...formData, billingDate: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500"
                        />
                    </div>
                    <div className="w-2/3">
                        <label className="block text-sm font-medium text-gray-700">内容项 / 经办人备注</label>
                        <input
                            type="text"
                            value={formData.remark}
                            onChange={e => setFormData({ ...formData, remark: e.target.value })}
                            placeholder="例：包含预付款开具，清单见附件。"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

            </div>
        </Modal>
    );
};
