'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';

export interface ReceiptForm {
    id?: string;
    planId: string;
    amount: string;
    receiptDate: string;
    paymentMethod: string;
    voucherNo: string;
    remark: string;
}

const defaultForm: ReceiptForm = {
    planId: '',
    amount: '',
    receiptDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    voucherNo: '',
    remark: ''
};

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: ReceiptForm | null;
    contractId: string;
    paymentPlans: any[]; // Used for dropdown linking
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, onSuccess, editData, contractId, paymentPlans }) => {
    const [formData, setFormData] = useState<ReceiptForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const formatted = { ...editData };
                if (formatted.receiptDate) formatted.receiptDate = formatted.receiptDate.split('T')[0];
                setFormData(formatted);
            } else {
                setFormData(defaultForm);
            }
            setErrorMsg('');
        }
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        const amountNum = parseFloat(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMsg('请填写合规的到账正数金额。');
            return;
        }
        if (!formData.receiptDate) {
            setErrorMsg('请明确具体的到账日期。');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const isEdit = !!formData.id;
            const res = await fetch(`/api/biz/contract/${contractId}/receipt`, {
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
            setErrorMsg('系统网络异常，请重试');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <button onClick={onClose} disabled={loading} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                取消
            </button>
            <button onClick={handleSubmit} disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50">
                {loading ? '核对入账中...' : '确认登账'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "修正到账流水记录" : "登记一笔实际收款"}
            width="md"
            footer={footer}
        >
            <div className="space-y-4">
                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">关联应收节点(可选)</label>
                    <select
                        value={formData.planId}
                        onChange={e => setFormData({ ...formData, planId: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                    >
                        <option value="">-- 作为前期打款/或暂不明确期次 --</option>
                        {paymentPlans.map(p => (
                            <option key={p.id} value={p.id}>{p.phase} (计划: {Number(p.expectedAmount).toLocaleString()})</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">实际到账金额 <span className="text-red-500">*</span></label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">￥</span>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="如实填报"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-green-500 focus:border-green-500 sm:text-sm font-bold text-green-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">业务确权日 <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            value={formData.receiptDate}
                            onChange={e => setFormData({ ...formData, receiptDate: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-green-500 font-medium text-gray-900"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">结算工具 / 方式</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-green-500 bg-white"
                        >
                            <option value="BANK_TRANSFER">公对公银行电汇</option>
                            <option value="BILL_ACCEPTANCE">银行/商业承兑汇票</option>
                            <option value="CASH">现金现款</option>
                            <option value="OTHER">其他划扣补偿</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">财务内部凭单号 / 汇款方</label>
                        <input
                            type="text"
                            value={formData.voucherNo}
                            onChange={e => setFormData({ ...formData, voucherNo: e.target.value })}
                            placeholder="(选填)"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">流水出入说明/补充</label>
                    <textarea
                        rows={2}
                        value={formData.remark}
                        onChange={e => setFormData({ ...formData, remark: e.target.value })}
                        placeholder="例：含上次图审退回后补充的3000块打款"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 sm:text-sm"
                    />
                </div>

            </div>
        </Modal>
    );
};
