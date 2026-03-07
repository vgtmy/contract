'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProTable, Column } from '@/components/common/ProTable';
import { FilterBar, FilterItem } from '@/components/common/FilterBar';

interface AuditLogItem {
    id: string;
    actionTime: string;
    operatorName: string;
    deptName?: string;
    module: string;
    actionType: string;
    summary: string;
    result: string;
}

export default function AuditLogPage() {
    const [data, setData] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [operatorName, setOperatorName] = useState('');
    const [module, setModule] = useState('');
    const [actionType, setActionType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: '15',
                ...(operatorName && { operatorName }),
                ...(module && { module }),
                ...(actionType && { actionType }),
                ...(startDate && { startDate: startDate + 'T00:00:00.000Z' }),
                ...(endDate && { endDate: endDate + 'T23:59:59.999Z' }),
            });

            const res = await fetch(`/api/system/audit-log?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.status === 403) {
                setErrorMsg('权限封锁：您当前使用的非 Admin 角色，无权窥探中央审计集群');
                setLoading(false);
                return;
            }

            const json = await res.json();
            if (res.ok && json.data) {
                setData(json.data.list);
                setTotal(json.data.pagination.total);
            } else {
                setErrorMsg(json.message || '获取数据失败');
            }
        } catch (e) {
            console.error('Failed to fetch audit logs', e);
            setErrorMsg('网络阻断加载失败');
        } finally {
            setLoading(false);
        }
    }, [page, operatorName, module, actionType, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const handleReset = () => {
        setOperatorName('');
        setModule('');
        setActionType('');
        setStartDate('');
        setEndDate('');
        setPage(1);
        setTimeout(fetchData, 0);
    };

    const columns: Column<AuditLogItem>[] = [
        {
            key: 'actionTime',
            title: '操作瞬间',
            width: '180px',
            render: (record) => (
                <span className="text-gray-500 font-mono text-xs">
                    {new Date(record.actionTime).toLocaleString()}
                </span>
            )
        },
        {
            key: 'operator',
            title: '责任账号',
            width: '150px',
            render: (record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{record.operatorName}</span>
                    <span className="text-xs text-gray-400">{record.deptName || '系统全域'}</span>
                </div>
            )
        },
        {
            key: 'module',
            title: '触达核心圈',
            width: '120px',
            render: (record) => {
                const map: Record<string, string> = {
                    AUTH: '🔑 安全认证',
                    CONTRACT: '📁 主轴台账',
                    PAYMENT_PLAN: '📅 收款安排',
                    RECEIPT: '💰 物理入账',
                    INVOICE: '🧾 发票销项',
                    FILE: '📎 电子归档',
                    EXPORT: '📤 外部导出'
                };
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs tracking-wider">{map[record.module] || record.module}</span>;
            }
        },
        {
            key: 'actionType',
            title: '行为侧写',
            width: '100px',
            render: (record) => {
                const styles: Record<string, string> = {
                    LOGIN: 'text-indigo-600 bg-indigo-50',
                    CREATE: 'text-green-600 bg-green-50',
                    UPDATE: 'text-blue-600 bg-blue-50',
                    DELETE: 'text-red-600 bg-red-50',
                    EXPORT: 'text-orange-600 bg-orange-50'
                };
                const s = styles[record.actionType] || 'text-gray-600 bg-gray-50';
                return <span className={`px-2 py-1 rounded text-xs font-bold ${s}`}>{record.actionType}</span>;
            }
        },
        {
            key: 'summary',
            title: '操作封存摘要 / 留痕描述',
            render: (record) => (
                <span className="text-gray-700 text-sm break-all font-medium">
                    {record.summary}
                </span>
            )
        },
        {
            key: 'result',
            title: '系统结语',
            align: 'center',
            width: '100px',
            render: (record) => (
                record.result === 'SUCCESS'
                    ? <span className="text-green-500 font-bold text-xs">✔ 平安着陆</span>
                    : <span className="text-red-500 font-bold text-xs">✖ 异常防阻</span>
            )
        }
    ];

    if (errorMsg) {
        return (
            <div className="mt-20 flex flex-col items-center justify-center p-8 bg-red-50 border border-red-100 rounded-lg">
                <span className="text-4xl">🛡️</span>
                <p className="mt-4 text-red-800 font-bold">{errorMsg}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">审计与安全留痕台账</h1>
                <p className="text-sm text-gray-500 mt-1">系统管理员专用视角。此面板已隐秘拦截整个系统环境内的高危流水干涉事件。</p>
            </div>

            <FilterBar onSearch={handleSearch} onReset={handleReset} loading={loading}>
                <FilterItem label="模糊操作人工号">
                    <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        placeholder="如: admin"
                    />
                </FilterItem>
                <FilterItem label="核心圈域 (模块)">
                    <select
                        value={module}
                        onChange={(e) => setModule(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    >
                        <option value="">全体雷达捕获</option>
                        <option value="AUTH">基座层 - 登入行为</option>
                        <option value="CONTRACT">业务层 - 台账核心</option>
                        <option value="PAYMENT_PLAN">业务层 - 期次拆解</option>
                        <option value="RECEIPT">财务流 - 物理入库</option>
                        <option value="INVOICE">合规流 - 法务开票</option>
                        <option value="FILE">档案库 - 文件上云</option>
                        <option value="EXPORT">脱离系 - 本地导出</option>
                    </select>
                </FilterItem>
                <FilterItem label="动作侧写 (增删改)">
                    <select
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    >
                        <option value="">全部侧写</option>
                        <option value="LOGIN">环境登入</option>
                        <option value="CREATE">实体生成 (增)</option>
                        <option value="UPDATE">参数篡改 (改)</option>
                        <option value="DELETE">抽底强拆 (删)</option>
                        <option value="EXPORT">全盘外抛 (存)</option>
                    </select>
                </FilterItem>
                <FilterItem label="锚点区间 (起)">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-500"
                    />
                </FilterItem>
                <FilterItem label="锚点区间 (止)">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-500"
                    />
                </FilterItem>
            </FilterBar>

            <ProTable
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.id}
                emptyText="近期天下太平，未捕获到任何异常留痕行为"
                pagination={{
                    current: page,
                    pageSize: 15,
                    total,
                    onChange: setPage
                }}
            />
        </div>
    );
}
