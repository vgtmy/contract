'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Feedback } from '@/components/common/Feedback';

interface DeptItem {
    id: string;
    name: string;
    parentId: string | null;
    managerId: string | null;
    sort: number;
    status: number;
    children?: DeptItem[];
}

export default function DeptsPage() {
    const [data, setData] = useState<DeptItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDept, setCurrentDept] = useState<Partial<DeptItem> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        parentId: '',
        managerId: '',
        sort: 0,
        status: 1
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/system/users');
            const json = await res.json();
            if (res.ok && json.data) setUsers(json.data);
        } catch (e) { console.error('Failed to fetch users', e); }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/system/depts?tree=1');
            const json = await res.json();
            if (res.ok && json.data) setData(json.data);
        } catch (e) { Feedback.error('加载部门树失败'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchData();
    }, [fetchData]);

    const handleAdd = (parentId: string | null = null) => {
        setFormData({ name: '', parentId: parentId || '', managerId: '', sort: 0, status: 1 });
        setIsAddModalOpen(true);
    };

    const handleEdit = (dept: DeptItem) => {
        setCurrentDept(dept);
        setFormData({
            name: dept.name,
            parentId: dept.parentId || '',
            managerId: dept.managerId || '',
            sort: dept.sort,
            status: dept.status
        });
        setIsEditModalOpen(true);
    };

    const handleSubmit = async (type: 'add' | 'edit') => {
        setIsSubmitting(true);
        try {
            const url = type === 'add' ? '/api/system/depts' : `/api/system/depts/${currentDept?.id}`;
            const method = type === 'add' ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                Feedback.success(type === 'add' ? '部门创建成功' : '变更已保存');
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchData();
            } else {
                const json = await res.json();
                Feedback.error(json.message);
            }
        } catch (e) { Feedback.error('操作失败'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (dept: DeptItem) => {
        if (!confirm(`确定要停用 [${dept.name}] 吗？`)) return;
        try {
            const res = await fetch(`/api/system/depts/${dept.id}`, { method: 'DELETE' });
            if (res.ok) {
                Feedback.success('已停用');
                fetchData();
            } else {
                const json = await res.json();
                Feedback.error(json.message);
            }
        } catch (e) { Feedback.error('请求失败'); }
    };

    // 递归渲染部门树节点
    const renderDeptNode = (dept: DeptItem, level: number = 0) => {
        return (
            <React.Fragment key={dept.id}>
                <tr className={`hover:bg-gray-50 transition-colors ${dept.status === 0 ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <span style={{ marginLeft: `${level * 24}px` }} className="text-gray-400 mr-2">
                                {dept.children && dept.children.length > 0 ? (level === 0 ? '🏢' : '📂') : '📄'}
                            </span>
                            <span className={`text-sm font-bold ${level === 0 ? 'text-blue-900 underline decoration-blue-200 underline-offset-4' : 'text-gray-700'}`}>
                                {dept.name}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {users.find(u => u.id === dept.managerId)?.name || <span className="text-gray-300 italic">未指定</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono">{dept.sort}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        {dept.status === 1 
                            ? <span className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 rounded-full border border-green-100">活跃</span>
                            : <span className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-400 rounded-full border border-gray-200 text-xs">停用</span>
                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold space-x-3">
                        <button onClick={() => handleAdd(dept.id)} className="text-blue-600 hover:text-blue-900 transition">新增子级</button>
                        <button onClick={() => handleEdit(dept)} className="text-indigo-600 hover:text-indigo-900 transition">编辑</button>
                        {dept.status === 1 && (
                            <button onClick={() => handleDelete(dept)} className="text-red-600 hover:text-red-900 transition">停用</button>
                        )}
                    </td>
                </tr>
                {dept.children && dept.children.map(child => renderDeptNode(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">全院组织架构</h1>
                    <p className="text-sm text-gray-500 mt-1">维护规划设计院的部门层级深度映射，支持多级嵌套与责任中心绑定。</p>
                </div>
                <button
                    onClick={() => handleAdd()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-bold transition flex items-center"
                >
                    <span className="mr-1">+</span> 创建一级部门
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">部门名称与层级</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">负责人</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">排序</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">管理操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">正在解析组织架构树...</td></tr>
                        ) : data.length > 0 ? (
                            data.map(d => renderDeptNode(d))
                        ) : (
                            <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">当前尚无部门档案数据</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 编辑/新增弹窗 */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? '创建新组织单元' : `部门调整 - ${currentDept?.name}`}
                footer={
                    <>
                        <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">返回</button>
                        <button 
                            disabled={isSubmitting} 
                            onClick={() => handleSubmit(isAddModalOpen ? 'add' : 'edit')} 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '保存中...' : '提交生效'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">上级组织架构</label>
                        <select
                            disabled={isAddModalOpen && formData.parentId !== ''} // 如果是从节点点的“新增子级”，锁定 parentId
                            value={formData.parentId}
                            onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
                        >
                            <option value="">顶级域 (无上级)</option>
                            {/* 这里简化显示扁平列表作为父级选择器 */}
                            {Array.from(new Set(data)).map(function flat(d: any): any {
                                return [
                                    <option key={d.id} value={d.id}>{d.name}</option>,
                                    ...(d.children ? d.children.map(flat) : [])
                                ];
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">部门全称 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            placeholder="如: 市政规划一所"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">部门负责人 (Manager)</label>
                            <select
                                value={formData.managerId}
                                onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="">待指派</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">行政显示排序</label>
                            <input
                                type="number"
                                value={formData.sort}
                                onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="越大越靠后"
                            />
                        </div>
                    </div>
                    
                    {isEditModalOpen && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">存续激活状态</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value={1}>✅ 活跃存续 (业务正常进行)</option>
                                <option value={0}>❌ 逻辑停用 (历史归零/撤销)</option>
                            </select>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
