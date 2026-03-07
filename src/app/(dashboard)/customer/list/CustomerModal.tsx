'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';

export interface CustomerForm {
    id?: string;
    name: string;
    type: string;
    creditLevel: string;
    contactPerson: string;
    contactPhone: string;
    taxNumber: string;
    address: string;
}

const defaultForm: CustomerForm = {
    name: '',
    type: '政府机关',
    creditLevel: 'A',
    contactPerson: '',
    contactPhone: '',
    taxNumber: '',
    address: ''
};

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: CustomerForm | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSuccess, editData }) => {
    const [formData, setFormData] = useState<CustomerForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData(editData);
            } else {
                setFormData(defaultForm);
            }
            setErrorMsg('');
        }
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        if (!formData.name) {
            setErrorMsg('客户名称不能为空');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const isEdit = !!formData.id;
            const url = isEdit ? `/api/biz/customer/${formData.id}` : '/api/biz/customer';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.code === 200) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(data.message || '保存失败');
            }
        } catch (e) {
            setErrorMsg('系统错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <>
            <button
                onClick={onClose}
                disabled={loading}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                取消
            </button>
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {loading ? '保存中...' : '确定'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "编辑客户台账" : "新增客户登记"}
            width="lg"
            footer={footer}
        >
            <div className="space-y-4">
                {errorMsg && <div className="bg-red-50 text-red-600 p-2 text-sm rounded">{errorMsg}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">客户名称 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="如：XX市自然资源和规划局"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">性质 <span className="text-red-500">*</span></label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="政府机关">政府机关</option>
                            <option value="事业单位">事业单位</option>
                            <option value="国有企业">国有企业</option>
                            <option value="民营企业">民营企业</option>
                            <option value="外资/合资">外资/合资</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">信用评级 <span className="text-red-500">*</span></label>
                        <select
                            value={formData.creditLevel}
                            onChange={e => setFormData({ ...formData, creditLevel: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="A">A级 (优异)</option>
                            <option value="B">B级 (良好)</option>
                            <option value="C">C级 (一般)</option>
                            <option value="D">D级 (黑名单)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">对接人姓名</label>
                        <input
                            type="text"
                            value={formData.contactPerson}
                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">联系电话</label>
                        <input
                            type="text"
                            value={formData.contactPhone}
                            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">统一社会信用代码/税号</label>
                    <input
                        type="text"
                        value={formData.taxNumber}
                        onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">单位通讯地址</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

            </div>
        </Modal>
    );
};
