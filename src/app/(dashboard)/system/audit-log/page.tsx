'use client';

import React, { useState, useEffect, useCallback } from 'react';

const MODULE_MAP: Record<string, string> = {
    AUTH:         '身份认证',
    CONTRACT:     '合同管理',
    RECEIPT:      '收款记录',
    INVOICE:      '发票管理',
    PAYMENT_PLAN: '收款计划',
    FILE:         '文件归档',
    EXPORT:       '数据导出',
    PROJECT:      '项目立项',
    CUSTOMER:     '客户管理',
};

const ACTION_MAP: Record<string, { label: string; color: string }> = {
    LOGIN:  { label: '登录', color: 'text-blue-500 bg-blue-50' },
    CREATE: { label: '创建', color: 'text-emerald-600 bg-emerald-50' },
    UPDATE: { label: '修改', color: 'text-amber-600 bg-amber-50' },
    DELETE: { label: '删除', color: 'text-rose-600 bg-rose-50' },
    EXPORT: { label: '导出', color: 'text-violet-600 bg-violet-50' },
};

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const url = activeModule
                ? `/api/system/audit-log?module=${activeModule}`
                : '/api/system/audit-log';
            const res = await fetch(url);
            const json = await res.json();
            if (json.code === 200) {
                setLogs(json.data.list);
                setTotal(json.data.total);
            }
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }, [activeModule]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">全链路审计日志</h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">记录所有关键操作行为，为数据安全与合规提供全量留痕</p>
                </div>
                <div className="px-4 py-2 bg-gray-900 text-white text-sm font-black rounded-2xl">
                    共 {total} 条记录
                </div>
            </div>

            {/* Module Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveModule('')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        activeModule === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                    }`}
                >
                    全部模块
                </button>
                {Object.entries(MODULE_MAP).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveModule(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeModule === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">操作记录流水</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-300 animate-pulse font-black">加载审计数据中...</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                {['时间', '操作人', '所属部门', '模块', '动作', '操作摘要', '结果'].map(h => (
                                    <th key={h} className="text-left text-xs font-black text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log: any) => {
                                const action = ACTION_MAP[log.actionType] || { label: log.actionType, color: 'text-gray-500 bg-gray-50' };
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                                            {new Date(log.actionTime).toLocaleString('zh-CN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-sm text-gray-800">{log.operatorName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{log.deptName || '—'}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                            {MODULE_MAP[log.module] || log.module}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${action.color}`}>
                                                {action.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-64">
                                            <span title={log.summary}>{log.summary}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-black ${log.result === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {log.result === 'SUCCESS' ? '✓ 成功' : '✗ 失败'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-20">
                                        <div className="text-4xl mb-4">🔍</div>
                                        <div className="text-gray-300 font-black text-sm">暂无审计记录</div>
                                        <div className="text-gray-200 text-xs mt-1">系统操作将在此自动留痕</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
