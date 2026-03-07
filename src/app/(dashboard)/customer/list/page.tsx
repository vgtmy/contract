'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';
import { StatusTag } from '@/components/common/StatusTag';
import { CustomerModal, CustomerForm } from './CustomerModal';

export default function CustomerListPage() {
    const [data, setData] = useState<CustomerForm[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // Query States
    const [page, setPage] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<CustomerForm | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: '10',
                ...(nameFilter && { name: nameFilter }),
                ...(typeFilter && { type: typeFilter }),
            });

            const res = await fetch(`/api/biz/customer?${params.toString()}`);
            const json = await res.json();
            if (res.ok && json.data) {
                setData(json.data.list);
                setTotal(json.data.pagination.total);
            }
        } catch (e) {
            console.error('Failed to fetch customers', e);
        } finally {
            setLoading(false);
        }
    }, [page, nameFilter, typeFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        setPage(1); // Reset to first page
        fetchData();
    };

    const handleReset = () => {
        setNameFilter('');
        setTypeFilter('');
        setPage(1);
        // fetchData will be triggered by dependency array usually if we separate committed state vs transient state.
        // For simplicity:
        setTimeout(fetchData, 0);
    };

    const openNew = () => {
        setEditItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: CustomerForm) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条客户记录吗？这可能会影响下辖的项目和合同关联。')) return;

        try {
            const res = await fetch(`/api/biz/customer/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            } else {
                const d = await res.json();
                alert(d.message || '删除失败');
            }
        } catch (e) {
            alert('系统出错');
        }
    };

    const columns: Column<CustomerForm>[] = [
        {
            key: 'name',
            title: '客户名称',
            dataIndex: 'name',
            render: (record) => (
                <span className="font-medium text-blue-600 truncate max-w-xs">{record.name}</span>
            )
        },
        {
            key: 'type',
            title: '性质',
            render: (record) => {
                let t = 'default';
                if (record.type === '政府机关' || record.type === '事业单位') t = 'processing';
                if (record.type === '民营企业') t = 'warning';
                return <StatusTag type={t as any} text={record.type} />;
            }
        },
        {
            key: 'creditLevel',
            title: '评级',
            align: 'center',
            render: (record) => {
                const map: any = { A: 'success', B: 'processing', C: 'warning', D: 'error' };
                return <StatusTag type={map[record.creditLevel]} text={`${record.creditLevel}级`} />;
            }
        },
        { key: 'contactPerson', title: '对接人', dataIndex: 'contactPerson' },
        { key: 'contactPhone', title: '电话', dataIndex: 'contactPhone' },
        {
            key: 'action',
            title: '操作',
            align: 'right',
            render: (record) => (
                <div className="flex justify-end space-x-3 text-sm">
                    <Link href={`/customer/detail/${record.id}`} className="text-blue-600 hover:text-blue-900">
                        详情
                    </Link>
                    <button onClick={() => openEdit(record)} className="text-indigo-600 hover:text-indigo-900">
                        编辑
                    </button>
                    <button onClick={() => handleDelete(record.id!)} className="text-red-600 hover:text-red-900">
                        删除
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">客户管护台账</h1>
                <button
                    onClick={openNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    登记新客户
                </button>
            </div>

            <FilterBar onSearch={handleSearch} onReset={handleReset} loading={loading}>
                <FilterItem label="客户全称模糊查询">
                    <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="支持片段如: 资规局"
                    />
                </FilterItem>
                <FilterItem label="性质分类">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">全部</option>
                        <option value="政府机关">政府机关</option>
                        <option value="事业单位">事业单位</option>
                        <option value="国有企业">国有企业</option>
                        <option value="民营企业">民营企业</option>
                    </select>
                </FilterItem>
            </FilterBar>

            <ProTable
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.id!}
                pagination={{
                    current: page,
                    pageSize: 10,
                    total,
                    onChange: setPage
                }}
            />

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                editData={editItem}
            />
        </div>
    );
}
