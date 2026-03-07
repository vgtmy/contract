'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';
import { StatusTag } from '@/components/common/StatusTag';
import { ProjectModal, ProjectForm } from './ProjectModal';

export default function ProjectListPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // Query States
    const [page, setPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ProjectForm | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: '10',
                ...(nameFilter && { name: nameFilter }),
                ...(statusFilter && { status: statusFilter }),
            });

            const res = await fetch(`/api/biz/project?${params.toString()}`);
            const json = await res.json();
            if (res.ok && json.data) {
                setData(json.data.list);
                setTotal(json.data.pagination.total);
            }
        } catch (e) {
            console.error('Failed to fetch projects', e);
        } finally {
            setLoading(false);
        }
    }, [page, nameFilter, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const handleReset = () => {
        setNameFilter('');
        setStatusFilter('');
        setPage(1);
        setTimeout(fetchData, 0);
    };

    const openNew = () => {
        setEditItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('严重警告：删除立项可能阻断合同与收款流水链路。确定删除该立项记录吗？')) return;
        try {
            const res = await fetch(`/api/biz/project/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            } else {
                const d = await res.json();
                alert(d.message || '删除阻断');
            }
        } catch (e) {
            alert('系统错误');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'serialNo',
            title: '立项编号',
            render: (record) => <span className="font-mono text-xs bg-gray-100 p-1 rounded text-gray-600">{record.serialNo}</span>
        },
        {
            key: 'name',
            title: '项目名称',
            dataIndex: 'name',
            render: (record) => (
                <span className="font-medium text-blue-600 truncate block max-w-xs">{record.name}</span>
            )
        },
        {
            key: 'customer',
            title: '所属客户(甲方)',
            render: (record) => record.customer?.name || '-'
        },
        {
            key: 'type',
            title: '类型',
            dataIndex: 'type',
        },
        {
            key: 'dept',
            title: '承办部门 / PM',
            render: (record) => (
                <div className="flex flex-col text-xs leading-tight">
                    <span className="text-gray-800">{record.deptName}</span>
                    <span className="text-gray-500 mt-0.5">{record.pmName}</span>
                </div>
            )
        },
        {
            key: 'status',
            title: '当前流转态',
            align: 'center',
            render: (record) => {
                const map: any = { ACTIVE: { t: 'success', d: '进行中' }, PAUSED: { t: 'warning', d: '暂缓挂起' }, CLOSED: { t: 'default', d: '交付结项' } };
                return <StatusTag type={map[record.status]?.t || 'default'} text={map[record.status]?.d || record.status} />;
            }
        },
        {
            key: 'action',
            title: '业务动作',
            align: 'right',
            render: (record) => (
                <div className="flex justify-end space-x-3 text-sm">
                    <Link href={`/project/detail/${record.id}`} className="text-blue-600 hover:text-blue-900">
                        全景看板
                    </Link>
                    <button onClick={() => openEdit(record)} className="text-indigo-600 hover:text-indigo-900">
                        属性修正
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
                        剔除
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">中心大项目立项库</h1>
                    <p className="mt-1 text-sm text-gray-500">此模块维护院内正式过会的母体项目台账，它是未来多份专项子合同的归属根节点。</p>
                </div>
                <button
                    onClick={openNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    登记新项目
                </button>
            </div>

            <FilterBar onSearch={handleSearch} onReset={handleReset} loading={loading}>
                <FilterItem label="项目名称查询">
                    <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500"
                        placeholder="支持片段截取..."
                    />
                </FilterItem>
                <FilterItem label="所处流转周期">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500"
                    >
                        <option value="">(全部)</option>
                        <option value="ACTIVE">推进履约中 (Active)</option>
                        <option value="PAUSED">停工扯皮挂起 (Paused)</option>
                        <option value="CLOSED">封卷了账 (Closed)</option>
                    </select>
                </FilterItem>
            </FilterBar>

            <ProTable
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.id}
                pagination={{
                    current: page,
                    pageSize: 10,
                    total,
                    onChange: setPage
                }}
            />

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                editData={editItem}
            />
        </div>
    );
}
