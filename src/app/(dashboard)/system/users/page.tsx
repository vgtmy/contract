'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';

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
    const [data, setData] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [depts, setDepts] = useState<any[]>([]);

    // Filters
    const [username, setUsername] = useState('');
    const [deptId, setDeptId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchDepts = async () => {
        try {
            const res = await fetch('/api/system/depts');
            const json = await res.json();
            if (res.ok && json.data) {
                setDepts(json.data);
            }
        } catch (e) {
            console.error('Failed to fetch departments', e);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = new URLSearchParams({
                ...(username && { username }),
                ...(deptId && { deptId }),
            });

            const res = await fetch(`/api/system/users?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            const json = await res.json();
            if (res.ok && json.data) {
                setData(json.data);
            } else {
                setErrorMsg(json.message || '获取数据失败');
            }
        } catch (e) {
            console.error('Failed to fetch users', e);
            setErrorMsg('网络阻断加载失败');
        } finally {
            setLoading(false);
        }
    }, [username, deptId]);

    useEffect(() => {
        fetchDepts();
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData();
    };

    const handleReset = () => {
        setUsername('');
        setDeptId('');
        // We use a small timeout to let the state clear before fetching
        setTimeout(fetchData, 0);
    };

    const columns: Column<UserItem>[] = [
        {
            key: 'username',
            title: '工号/账号',
            width: '120px',
            render: (record) => (
                <span className="font-mono font-bold text-blue-600">{record.username}</span>
            )
        },
        {
            key: 'name',
            title: '姓名',
            width: '120px',
            render: (record) => (
                <span className="font-medium text-gray-900">{record.name}</span>
            )
        },
        {
            key: 'dept',
            title: '所属部门',
            width: '180px',
            render: (record) => (
                <span className="text-gray-600 text-sm">{record.dept?.name || '未分配部门'}</span>
            )
        },
        {
            key: 'roles',
            title: '分配角色',
            render: (record) => (
                <div className="flex flex-wrap gap-1">
                    {record.roles.map(role => (
                        <span key={role.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {role.name}
                        </span>
                    ))}
                    {record.roles.length === 0 && <span className="text-gray-400 text-xs italic">无角色</span>}
                </div>
            )
        },
        {
            key: 'status',
            title: '账户状态',
            width: '100px',
            align: 'center',
            render: (record) => (
                record.status === 1
                    ? <span className="flex items-center justify-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100 italic">ACTIVE</span>
                    : <span className="flex items-center justify-center text-red-400 text-xs font-bold bg-gray-50 px-2 py-1 rounded-full border border-gray-100">DISABLED</span>
            )
        },
        {
            key: 'createdAt',
            title: '建档时间',
            width: '150px',
            render: (record) => (
                <span className="text-gray-400 text-xs">
                    {new Date(record.createdAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">组织与人员管理</h1>
                <p className="text-sm text-gray-500 mt-1">管理系统内部员工账号、部门归属、以及职责角色的核心元数据面板。</p>
            </div>

            <FilterBar onSearch={handleSearch} onReset={handleReset} loading={loading}>
                <FilterItem label="工号/账号搜索">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="输入工号精确匹配"
                    />
                </FilterItem>
                <FilterItem label="按部门筛选">
                    <select
                        value={deptId}
                        onChange={(e) => setDeptId(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">全部部门</option>
                        {depts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </FilterItem>
            </FilterBar>

            {errorMsg && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-md text-sm text-red-600 mb-4 font-medium">
                    {errorMsg}
                </div>
            )}

            <ProTable
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.id}
                emptyText="未检索到任何符合条件的员工档案"
            />

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start space-x-3">
                <span className="text-blue-500 mt-0.5">💡</span>
                <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1">管理员提示：</p>
                    <p>当前版本仅支持数据查询与穿透展示。人员的新增、角色调拨、以及部门迁徙等原子化写操作功能将在下一迭代周期（Sprint 6）正式入库启用。</p>
                </div>
            </div>
        </div>
    );
}
