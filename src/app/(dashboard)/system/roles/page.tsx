'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProTable, Column } from '@/components/common/ProTable';
import { Modal } from '@/components/common/Modal';
import { Feedback } from '@/components/common/Feedback';

interface RoleItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    createdAt: string;
}

interface MenuItem {
    id: string;
    name: string;
    type: 'DIR' | 'MENU' | 'BUTTON';
    children?: MenuItem[];
}

export default function RolesPage() {
    const [data, setData] = useState<RoleItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // 角色管理状态
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Partial<RoleItem> | null>(null);
    const [roleFormData, setRoleFormData] = useState({ code: '', name: '', description: '' });

    // 权限分配状态
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
    const [checkedMenuIds, setCheckedMenuIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/system/roles');
            const json = await res.json();
            if (res.ok && json.data) setData(json.data);
        } catch (e) { Feedback.error('加载角色列表失败'); }
        finally { setLoading(false); }
    }, []);

    const fetchMenuTree = async () => {
        try {
            const res = await fetch('/api/system/menus/tree');
            const json = await res.json();
            if (res.ok && json.data) setMenuTree(json.data);
        } catch (e) { console.error('Failed to fetch menu tree', e); }
    };

    useEffect(() => {
        fetchData();
        fetchMenuTree();
    }, [fetchData]);

    const handleAddRole = () => {
        setCurrentRole(null);
        setRoleFormData({ code: '', name: '', description: '' });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: RoleItem) => {
        setCurrentRole(role);
        setRoleFormData({ code: role.code, name: role.name, description: role.description || '' });
        setIsRoleModalOpen(true);
    };

    const handleSubmitRole = async () => {
        setIsSubmitting(true);
        try {
            const url = currentRole ? `/api/system/roles/${currentRole.id}` : '/api/system/roles';
            const method = currentRole ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleFormData)
            });
            if (res.ok) {
                Feedback.success('提交存档成功');
                setIsRoleModalOpen(false);
                fetchData();
            } else {
                const json = await res.json();
                Feedback.error(json.message);
            }
        } catch (e) { Feedback.error('网络通讯异常'); }
        finally { setIsSubmitting(false); }
    };

    const handleOpenPerm = async (role: RoleItem) => {
        setCurrentRole(role);
        setIsPermModalOpen(true);
        setCheckedMenuIds([]); // 先清空
        try {
            const res = await fetch(`/api/system/roles/${role.id}/permissions`);
            const json = await res.json();
            if (res.ok && json.data) setCheckedMenuIds(json.data);
        } catch (e) { Feedback.error('加载权限数据失败'); }
    };

    const handleSubmitPerm = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/system/roles/${currentRole?.id}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuIds: checkedMenuIds })
            });
            if (res.ok) {
                Feedback.success('权限重载成功');
                setIsPermModalOpen(false);
            } else {
                Feedback.error('保存失败');
            }
        } catch (e) { Feedback.error('请求超时'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (role: RoleItem) => {
        if (!confirm(`警告：删除角色 [${role.name}] 可能导致关联用户权限缺失，是否继续？`)) return;
        try {
            const res = await fetch(`/api/system/roles/${role.id}`, { method: 'DELETE' });
            if (res.ok) {
                Feedback.success('已物理删除');
                fetchData();
            } else {
                const json = await res.json();
                Feedback.error(json.message);
            }
        } catch (e) { Feedback.error('后端链接失败'); }
    };

    // 递归渲染权限树勾选框
    const renderMenuCheckbox = (menu: MenuItem, level: number = 0) => {
        const isChecked = checkedMenuIds.includes(menu.id);
        const toggleCheck = (id: string, checked: boolean) => {
            if (checked) setCheckedMenuIds(prev => [...prev, id]);
            else setCheckedMenuIds(prev => prev.filter(mid => mid !== id));
        };

        return (
            <div key={menu.id} className="mt-2" style={{ marginLeft: `${level * 24}px` }}>
                <label className="inline-flex items-center space-x-2 group cursor-pointer p-1 rounded hover:bg-gray-50 transition">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => toggleCheck(menu.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <span className={`text-sm ${menu.type === 'DIR' ? 'font-black text-gray-900 border-b-2 border-indigo-100' : 'text-gray-700'}`}>
                        {menu.name}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1 rounded uppercase tracking-tighter">
                        {menu.type}
                    </span>
                </label>
                {menu.children && menu.children.map(child => renderMenuCheckbox(child, level + 1))}
            </div>
        );
    };

    const columns: Column<RoleItem>[] = [
        {
            key: 'code',
            title: '角色主控码',
            width: '150px',
            render: (r) => <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{r.code}</span>
        },
        {
            key: 'name',
            title: '角色名称',
            width: '150px',
            render: (r) => <span className="font-bold text-gray-900">{r.name}</span>
        },
        {
            key: 'description',
            title: '职责描述与定义',
            render: (r) => <span className="text-gray-500 text-sm">{r.description || <span className="italic text-gray-300">未设置描述</span>}</span>
        },
        {
            key: 'createdAt',
            title: '创建时间',
            width: '120px',
            render: (r) => <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
        },
        {
            key: 'action',
            title: '控制台',
            width: '200px',
            align: 'right',
            render: (r) => (
                <div className="flex justify-end space-x-3">
                    <button onClick={() => handleOpenPerm(r)} className="text-indigo-600 hover:text-indigo-900 text-xs font-black ring-1 ring-indigo-200 px-2 py-1 rounded bg-white hover:bg-indigo-50 transition">分配权限</button>
                    <button onClick={() => handleEditRole(r)} className="text-blue-600 hover:text-blue-900 text-xs font-bold">编辑</button>
                    <button onClick={() => handleDelete(r)} className="text-red-600 hover:text-red-900 text-xs font-bold">移除</button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">权限防线与角色定义</h1>
                    <p className="text-sm text-gray-500 mt-1">通过“角色”解耦员工与各类确权资源，实现精细化的按钮级权限穿透与数据隔离。</p>
                </div>
                <button
                    onClick={handleAddRole}
                    className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md shadow-sm text-sm font-bold transition flex items-center"
                >
                    <span className="mr-1">+</span> 定义新角色
                </button>
            </div>

            <ProTable columns={columns} dataSource={data} loading={loading} rowKey={r => r.id} />

            {/* 角色编辑弹窗 */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={currentRole ? `角色定义修改 - ${currentRole.name}` : '定义全新业务角色'}
                footer={
                    <>
                        <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">返回</button>
                        <button 
                            disabled={isSubmitting} 
                            onClick={handleSubmitRole} 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '保存中...' : '提交存档'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">唯一识别码 (Code) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={roleFormData.code}
                                onChange={e => setRoleFormData({ ...roleFormData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                                placeholder="如: FINANCE_AUDITOR"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">角色中文名 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={roleFormData.name}
                                onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="如: 财务部审计专员"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">职责范围定义与备注</label>
                        <textarea
                            rows={3}
                            value={roleFormData.description}
                            onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            placeholder="描述该角色在系统内拥有的具体职责深度..."
                        />
                    </div>
                </div>
            </Modal>

            {/* 权限分配弹窗 */}
            <Modal
                isOpen={isPermModalOpen}
                onClose={() => setIsPermModalOpen(false)}
                title={`权限矩阵映射 - ${currentRole?.name}`}
                width="lg"
                footer={
                    <>
                        <button onClick={() => setIsPermModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">放弃更改</button>
                        <button 
                            disabled={isSubmitting} 
                            onClick={handleSubmitPerm} 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '保存中...' : '重载权限配置'}
                        </button>
                    </>
                }
            >
                <div>
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r shadow-sm">
                        <p className="text-xs text-blue-800 font-medium italic">
                            正在为角色 <strong>[{currentRole?.name}]</strong> 精确授权。勾选下方的菜单树节点，即可开启该角色对特定页面或功能按钮的访问权。
                        </p>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto px-4 pb-4 bg-gray-50 rounded-xl border border-gray-200">
                        {menuTree.length > 0 ? (
                            menuTree.map(m => renderMenuCheckbox(m))
                        ) : (
                            <p className="py-20 text-center text-gray-400 italic">尚无菜单数据，请先在系统设置中初始化菜单池</p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
