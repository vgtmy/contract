'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';
import { Modal } from '@/components/common/Modal';
// import { Feedback } from '@/components/common/Feedback'; // Removed due to missing export

interface UserItem {
    id: string;
    username: string;
    name: string;
    status: number;
    deptId: string | null;
    dept?: { id: string; name: string };
    roles: { id: string; name: string; code: string }[];
    createdAt: string;
}

export default function UsersPage() {
    // 数据与状态
    const [data, setData] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [depts, setDepts] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

    // 搜索过滤状态
    const [usernameSearch, setUsernameSearch] = useState('');
    const [deptIdSearch, setDeptIdSearch] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // 弹窗状态
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<UserItem> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 表单状态 (基础简单处理)
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        password: '',
        deptId: '',
        status: 1,
        roleIds: [] as string[]
    });

    const fetchDepts = async () => {
        try {
            const res = await fetch('/api/system/depts');
            const json = await res.json();
            if (res.ok && json.data) setDepts(json.data);
        } catch (e) { console.error('Failed to fetch depts', e); }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/system/roles');
            const json = await res.json();
            if (res.ok && json.data) setRoles(json.data);
        } catch (e) { console.error('Failed to fetch roles', e); }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = new URLSearchParams({
                ...(usernameSearch && { username: usernameSearch }),
                ...(deptIdSearch && { deptId: deptIdSearch }),
            });
            const res = await fetch(`/api/system/users?${params.toString()}`);
            if (res.status === 401) { window.location.href = '/login'; return; }
            const json = await res.json();
            if (res.ok && json.data) setData(json.data);
            else setErrorMsg(json.message || '获取数据失败');
        } catch (e) { setErrorMsg('网络加载异常'); }
        finally { setLoading(false); }
    }, [usernameSearch, deptIdSearch]);

    useEffect(() => {
        fetchDepts();
        fetchRoles();
        fetchData();
    }, [fetchData]);

    // 操作处理
    const handleAdd = () => {
        setFormData({ username: '', name: '', password: '', deptId: '', status: 1, roleIds: [] });
        setIsAddModalOpen(true);
    };

    const handleEdit = (user: UserItem) => {
        setCurrentUser(user);
        setFormData({
            username: user.username,
            name: user.name,
            password: '', // 密码不回填
            deptId: user.deptId || '',
            status: user.status,
            roleIds: user.roles.map(r => r.id)
        });
        setIsEditModalOpen(true);
    };

    const handleDisable = async (user: UserItem) => {
        if (!confirm(`确定要停用用户 [${user.name}] 吗？停用后该用户将无法进入系统。`)) return;
        try {
            const res = await fetch(`/api/system/users/${user.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (res.ok) {
                alert('已禁用');
                fetchData();
            } else {
                alert(json.message);
            }
        } catch (e) { alert('提交失败'); }
    };

    const handleSubmit = async (type: 'add' | 'edit') => {
        setIsSubmitting(true);
        try {
            const url = type === 'add' ? '/api/system/users' : `/api/system/users/${currentUser?.id}`;
            const method = type === 'add' ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (res.ok) {
                alert(type === 'add' ? (json.data._tempPassword ? `创建成功！临时密码：${json.data._tempPassword}` : '创建成功') : '修改成功');
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchData();
            } else {
                alert(json.message);
            }
        } catch (e) { alert('请求失败'); }
        finally { setIsSubmitting(false); }
    };

    const columns: Column<UserItem>[] = [
        {
            key: 'username',
            title: '工号/账号',
            width: '120px',
            render: (r) => <span className="font-mono font-bold text-blue-600">{r.username}</span>
        },
        {
            key: 'name',
            title: '姓名',
            width: '120px',
            render: (r) => <span className="font-medium text-gray-900">{r.name}</span>
        },
        {
            key: 'dept',
            title: '所属部门',
            width: '180px',
            render: (r) => <span className="text-gray-600 text-sm">{r.dept?.name || '未分配部门'}</span>
        },
        {
            key: 'roles',
            title: '角色权限',
            render: (r) => (
                <div className="flex flex-wrap gap-1">
                    {r.roles.map(role => (
                        <span key={role.id} className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">{role.name}</span>
                    ))}
                </div>
            )
        },
        {
            key: 'status',
            title: '状态',
            width: '100px',
            align: 'center',
            render: (r) => (
                r.status === 1 
                    ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100">正常</span>
                    : <span className="text-red-400 text-xs font-bold bg-gray-50 px-2 py-1 rounded-full border border-gray-100">禁用</span>
            )
        },
        {
            key: 'action',
            title: '操作',
            width: '150px',
            align: 'right',
            render: (r) => (
                <div className="flex justify-end space-x-2">
                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-900 text-xs font-bold">编辑</button>
                    {r.status === 1 && <button onClick={() => handleDisable(r)} className="text-red-600 hover:text-red-900 text-xs font-bold">禁用</button>}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">人员基座管理</h1>
                    <p className="text-sm text-gray-500 mt-1">负责全院员工的入职建档、职责分配以及数字身份的安全管控。</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-bold transition flex items-center"
                >
                    <span className="mr-1">+</span> 入职新员工
                </button>
            </div>

            <FilterBar onSearch={fetchData} onReset={() => { setUsernameSearch(''); setDeptIdSearch(''); setTimeout(fetchData, 0); }} loading={loading}>
                <FilterItem label="工号/账号">
                    <input type="text" value={usernameSearch} onChange={e => setUsernameSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md sm:text-sm" placeholder="全匹配搜索" />
                </FilterItem>
                <FilterItem label="所属部门">
                    <select value={deptIdSearch} onChange={e => setDeptIdSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md sm:text-sm">
                        <option value="">全部部门</option>
                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </FilterItem>
            </FilterBar>

            <ProTable columns={columns} dataSource={data} loading={loading} rowKey={r => r.id} />

            {/* 编辑/新增弹窗内容 */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? '入职登记 (新增用户)' : `档案修改 - ${currentUser?.name}`}
                footer={
                    <>
                        <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">取消</button>
                        <button 
                            disabled={isSubmitting} 
                            onClick={() => handleSubmit(isAddModalOpen ? 'add' : 'edit')} 
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '保存中...' : '提交存档'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">工号/登录账号 <span className="text-red-500">*</span></label>
                            <input
                                disabled={isEditModalOpen}
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white"
                                placeholder="如: admin"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">真实姓名 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="输入员工实名"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">所属行政部门</label>
                            <select
                                value={formData.deptId}
                                onChange={e => setFormData({ ...formData, deptId: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="">未分配 (暂不挂载)</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">在职状态</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value={1}>✅ 正常 (可正常搬砖)</option>
                                <option value={0}>❌ 停用 (禁止系统访问)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">登录密码 {isEditModalOpen && <span className="text-blue-500 text-[10px] font-normal">(若无需修改请留空)</span>}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            placeholder={isEditModalOpen ? "输入新密码进行强制重置" : "留空则自动生成 8 位临时密码"}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">映射权限角色 <span className="text-gray-400 text-[10px] uppercase font-normal">(多选)</span></label>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.roleIds.includes(role.id)}
                                        onChange={e => {
                                            const newRoleIds = e.target.checked
                                                ? [...formData.roleIds, role.id]
                                                : formData.roleIds.filter(id => id !== role.id);
                                            setFormData({ ...formData, roleIds: newRoleIds });
                                        }}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-blue-600 transition">{role.name}</span>
                                </label>
                            ))}
                            {roles.length === 0 && <span className="text-xs text-gray-400 italic">尚未配置系统角色</span>}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
