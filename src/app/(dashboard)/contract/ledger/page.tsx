'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';
import { StatusTag } from '@/components/common/StatusTag';

export default function ContractLedgerPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // Custom hook or context to get currentUser would be better, but we can fetch /api/auth/me to know role
    const [userRole, setUserRole] = useState('');

    // Filters
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [minSignDate, setMinSignDate] = useState('');
    const [maxSignDate, setMaxSignDate] = useState('');

    const [exporting, setExporting] = useState(false);

    // 1. Fetch current user context
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(json => {
                if (json.data) setUserRole(json.data.user.role);
            });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: '10',
                ...(statusFilter && { status: statusFilter }),
                ...(deptFilter && { deptId: deptFilter }),
                ...(minAmount && { minAmount }),
                ...(maxAmount && { maxAmount }),
                ...(minSignDate && { signDateStart: minSignDate }),
                ...(maxSignDate && { signDateEnd: maxSignDate }),
            });

            const res = await fetch(`/api/biz/contract?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            const json = await res.json();
            if (res.ok && json.data) {
                setData(json.data.list);
                setTotal(json.data.pagination.total);
            }
        } catch (e) {
            console.error('Failed to fetch contracts', e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, deptFilter, minAmount, maxAmount, minSignDate, maxSignDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const handleReset = () => {
        setStatusFilter('');
        setDeptFilter('');
        setMinAmount('');
        setMaxAmount('');
        setMinSignDate('');
        setMaxSignDate('');
        setPage(1);
        setTimeout(fetchData, 0);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({
                ...(statusFilter && { status: statusFilter }),
                ...(deptFilter && { deptId: deptFilter }),
                ...(minAmount && { minAmount }),
                ...(maxAmount && { maxAmount }),
                ...(minSignDate && { signDateStart: minSignDate }),
                ...(maxSignDate && { signDateEnd: maxSignDate }),
            });

            const res = await fetch(`/api/biz/contract/export?${params.toString()}`);
            const json = await res.json();

            if (res.ok && json.data) {
                // Dynamically import xlsx for client-side usage only on demand
                const XLSX = await import('xlsx');

                // Map the data into Excel-friendly structure
                const excelData = json.data.map((item: any) => ({
                    '合同编号': item.serialNo,
                    '合同名称': item.name,
                    '客户名称': item.customerName,
                    '项目名称': item.projectName,
                    '承办部门': item.deptName,
                    '负责人': item.pmName,
                    '合同总额(元)': item.totalAmount,
                    '已收回款(元)': item.receiptAmount,
                    '未收欠款(元)': item.unreceivedAmount,
                    '已开票面(元)': item.invoiceAmount,
                    '签订日期': item.signDate,
                    '履约状态': item.status,
                    '附件数': item.fileCount
                }));

                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, '合同台账精选');

                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                XLSX.writeFile(workbook, `合同台账报表_${dateStr}.xlsx`);
            } else {
                alert('提取导出数据失败：' + (json.message || '未知异常'));
            }
        } catch (e) {
            console.error('Export error', e);
            alert('系统网络或构建异常导致导出失败');
        } finally {
            setExporting(false);
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'serialNo',
            title: '合同编号',
            render: (record) => <span className="font-mono text-gray-500">{record.serialNo}</span>
        },
        {
            key: 'name',
            title: '合同名称',
            dataIndex: 'name',
            render: (record) => (
                <Link href={`/contract/detail/${record.id}`} className="font-medium text-blue-600 hover:underline max-w-[200px] truncate block">
                    {record.name}
                </Link>
            )
        },
        {
            key: 'customer',
            title: '关联甲方',
            render: (record) => record.customer?.name || '-'
        },
        {
            key: 'totalAmount',
            title: '合同额(元)',
            align: 'right',
            render: (record) => (
                <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                    ￥{Number(record.totalAmount).toLocaleString()}
                </span>
            )
        },
        {
            key: 'pmDept',
            title: '负责架构',
            render: (record) => (
                <div className="flex flex-col text-xs">
                    <span className="text-gray-900">{record.deptName}</span>
                    <span className="text-gray-500">[{record.pmName}]</span>
                </div>
            )
        },
        {
            key: 'status',
            title: '履约阶段',
            align: 'center',
            render: (record) => {
                const map: Record<string, any> = {
                    DRAFT: { type: 'default', text: '草拟录入' },
                    PROCESS: { type: 'processing', text: '审批中' },
                    ACTIVE: { type: 'success', text: '履行中' },
                    CLOSED: { type: 'warning', text: '已结案' }
                };
                const config = map[record.status] || map['DRAFT'];
                return <StatusTag type={config.type} text={config.text} />;
            }
        },
        {
            key: 'action',
            title: '操作',
            align: 'right',
            render: (record) => (
                <Link href={`/contract/detail/${record.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                    查看详情
                </Link>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">全院合同台账</h1>
                    <p className="text-sm text-gray-500 mt-1">当前权限视角: {userRole === 'ADMIN' ? '全局跨部门' : userRole === 'MANAGER' ? '本部门可见' : '仅本人负责可见'}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${exporting ? 'bg-gray-100 text-gray-400' : 'text-gray-700 bg-white hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {exporting ? '提取中...' : '下载清单 (Excel)'}
                    </button>
                    <Link
                        href="/contract/draft"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        起草新合同
                    </Link>
                </div>
            </div>

            <FilterBar onSearch={handleSearch} onReset={handleReset} loading={loading}>
                {userRole === 'ADMIN' && (
                    <FilterItem label="按部门筛选">
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        >
                            <option value="">全院所有部门</option>
                            <option value="dept-1">规划一所 (模拟ID)</option>
                            <option value="dept-2">建筑设计院 (模拟ID)</option>
                        </select>
                    </FilterItem>
                )}
                <FilterItem label="合同生命周期">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    >
                        <option value="">全部状态</option>
                        <option value="DRAFT">草稿起草</option>
                        <option value="PROCESS">审批流转中</option>
                        <option value="ACTIVE">盖章生效(履行中)</option>
                        <option value="CLOSED">资金结清(已结案)</option>
                    </select>
                </FilterItem>
                <FilterItem label="金额区间(最低)">
                    <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        placeholder="￥"
                    />
                </FilterItem>
                <FilterItem label="金额区间(最高)">
                    <input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        placeholder="￥"
                    />
                </FilterItem>
                <FilterItem label="签约时间(起)">
                    <input
                        type="date"
                        value={minSignDate}
                        onChange={(e) => setMinSignDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-500"
                    />
                </FilterItem>
                <FilterItem label="签约时间(止)">
                    <input
                        type="date"
                        value={maxSignDate}
                        onChange={(e) => setMaxSignDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-500"
                    />
                </FilterItem>
            </FilterBar>

            <ProTable
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.id}
                emptyText="您当前权限范围内没有匹配的合同数据"
                pagination={{
                    current: page,
                    pageSize: 10,
                    total,
                    onChange: setPage
                }}
            />
        </div>
    );
}
