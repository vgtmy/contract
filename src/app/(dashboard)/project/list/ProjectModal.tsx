'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';

export interface ProjectForm {
    id?: string;
    serialNo?: string;
    name: string;
    type: string;
    customerId: string;
    deptId: string;
    deptName: string;
    pmId: string;
    pmName: string;
    status: string;
    budget: number | string;
    startDate?: string;
    endDate?: string;
    remark?: string;
}

const defaultForm: ProjectForm = {
    name: '',
    type: '市政工程',
    customerId: '',
    deptId: 'dept-1', // Default mock
    deptName: '规划一所',
    pmId: 'pm-1', // Default mock
    pmName: '业务员小李',
    status: 'ACTIVE',
    budget: 0,
};

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: ProjectForm | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess, editData }) => {
    const [formData, setFormData] = useState<ProjectForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // To populate customer dropdown
    const [customers, setCustomers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch customer simple list upon mount
        fetch('/api/biz/customer?pageSize=100')
            .then(res => res.json())
            .then(json => {
                if (json.data && json.data.list) setCustomers(json.data.list);
            }).catch(() => { });
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                // format dates from iso string if exists
                const formatted = { ...editData };
                if (formatted.startDate) formatted.startDate = formatted.startDate.split('T')[0];
                if (formatted.endDate) formatted.endDate = formatted.endDate.split('T')[0];
                setFormData(formatted);
            } else {
                setFormData(defaultForm);
            }
            setErrorMsg('');
        }
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.customerId || !formData.type) {
            setErrorMsg('项目名称、所属客户与项目类型为必填项');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const isEdit = !!formData.id;
            const url = isEdit ? `/api/biz/project/${formData.id}` : '/api/biz/project';
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
                {loading ? '提交中...' : '确定立项'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editData ? "编辑项目台账" : "新建内部项目立项"}
            width="lg"
            footer={footer}
        >
            <div className="space-y-4">
                {errorMsg && <div className="bg-red-50 text-red-600 p-2 text-sm rounded">{errorMsg}</div>}

                {editData?.serialNo && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">项目编号 (系统生成)</label>
                        <input
                            type="text"
                            value={formData.serialNo || ''}
                            disabled
                            className="mt-1 block w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-md sm:text-sm text-gray-500"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">项目名称 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="如：XX市中心城区地下管网新建规划项目"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">所属客户 (甲方) <span className="text-red-500">*</span></label>
                        <select
                            value={formData.customerId}
                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- 请选择关联客户 --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">项目类型 <span className="text-red-500">*</span></label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="市政工程">市政工程类</option>
                            <option value="景观园林">景观园林类</option>
                            <option value="建筑规划">建筑规划类</option>
                            <option value="专项课题">专项课题研究</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">项目状态</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        >
                            <option value="ACTIVE">跟进执行中</option>
                            <option value="PAUSED">暂停挂起</option>
                            <option value="CLOSED">项目结项</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">预计产值/预算总额</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                ￥
                            </span>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">计划下达/开始日期</label>
                        <input
                            type="date"
                            value={formData.startDate || ''}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">预计结束/截点日</label>
                        <input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">承办方 (架构及PM)</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600 flex justify-between">
                        <span>承办部门: {formData.deptName}</span>
                        <span>负责人: {formData.pmName}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">目前阶段自动取用当前登录用户的挂职信息，未来可联动员工组件划片选取。</p>
                </div>

            </div>
        </Modal>
    );
};
