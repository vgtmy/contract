'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';

export interface PaymentPlanForm {
    id?: string;
    phase: string;
    expectedAmount: string;
    expectedDate: string;
    condition: string;
    status?: string;
    remark?: string;
}

const defaultForm: PaymentPlanForm = {
    phase: '第一期(预付款)',
    expectedAmount: '',
    expectedDate: '',
    condition: '合同签订归档后10个工作日内',
};

interface PaymentPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: PaymentPlanForm | null;
    contractId: string;
}

export const PaymentPlanModal: React.FC<PaymentPlanModalProps> = ({ isOpen, onClose, onSuccess, editData, contractId }) => {
    const [formData, setFormData] = useState<PaymentPlanForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const formatted = { ...editData };
                if (formatted.expectedDate) formatted.expectedDate = formatted.expectedDate.split('T')[0];
                setFormData(formatted);
            } else {
                setFormData(defaultForm);
            }
            setErrorMsg('');
        }
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        if (!formData.phase) {
            setErrorMsg('请填写该笔收款的期次说明。');
            return;
        }
        const amountNum = parseFloat(formData.expectedAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMsg('计划金额需填入合规正数。');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const isEdit = !!formData.id;
            // Depending on our routing design, PUT is technically /payment-plan but we coded it to be on the same endpoint context path 
            // For simplicity in the Nextjs app dir, let's call it via the same path.

            const res = await fetch(`/api/biz/contract/${contractId}/payment-plan`, {
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
            <button onClick={handleSubmit} disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50">
                {loading ? '规划中...' : '提交节点'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "修正式计划条款" : "新增合同收款节点"}
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
                    <label className="block text-sm font-medium text-gray-700">期次 / 阶段名 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.phase}
                        onChange={e => setFormData({ ...formData, phase: e.target.value })}
                        placeholder="例：第一期、尾款、质保金"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">计划催收金额 <span className="text-red-500">*</span></label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">￥</span>
                        <input
                            type="number"
                            value={formData.expectedAmount}
                            onChange={e => setFormData({ ...formData, expectedAmount: e.target.value })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">计划开票/收款节点日</label>
                    <input
                        type="date"
                        value={formData.expectedDate}
                        onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">达成条件/里程碑说明</label>
                    <textarea
                        rows={2}
                        value={formData.condition}
                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        placeholder="例：图纸审查通过后"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                </div>

                {editData && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">实际状态强行介入修偏</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500"
                        >
                            <option value="UNMET">节点条件未达成(UNMET)</option>
                            <option value="PENDING">已达标待收款(PENDING)</option>
                            <option value="RECEIVED">资金已落实(RECEIVED)</option>
                            <option value="OVERDUE">预期暴雷(OVERDUE)</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">注：后期应全部由关联发票和资金大流水系统自动回写状态，现阶段提供手动纠正池。</p>
                    </div>
                )}

            </div>
        </Modal>
    );
};
