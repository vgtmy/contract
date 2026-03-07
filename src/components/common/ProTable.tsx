'use client';

import React from 'react';
import { Loading, Empty } from './Feedback';

export interface Column<T> {
    key: string;
    title: string;
    dataIndex?: keyof T;
    render?: (record: T, index: number) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface ProTableProps<T> {
    columns: Column<T>[];
    dataSource: T[];
    loading?: boolean;
    rowKey: (record: T) => string;
    emptyText?: string;
    // Simplified pagination for Sprint 1
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number) => void;
    } | false;
}

export function ProTable<T>({
    columns,
    dataSource,
    loading = false,
    rowKey,
    emptyText = '暂无数据',
    pagination = false
}: ProTableProps<T>) {

    const colAlign = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${colAlign(col.align)}`}
                                    style={{ width: col.width }}
                                >
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <Loading text="数据加载中..." />
                                </td>
                            </tr>
                        ) : dataSource.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <Empty message={emptyText} />
                                </td>
                            </tr>
                        ) : (
                            dataSource.map((record, index) => (
                                <tr key={rowKey(record)} className="hover:bg-gray-50 transition-colors">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${colAlign(col.align)}`}
                                        >
                                            {col.render
                                                ? col.render(record, index)
                                                : col.dataIndex
                                                    ? String(record[col.dataIndex] || '')
                                                    : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {pagination && dataSource.length > 0 && !loading && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                共 <span className="font-medium">{pagination.total}</span> 条记录
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => pagination.onChange(Math.max(1, pagination.current - 1))}
                                    disabled={pagination.current === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <span className="sr-only">上一页</span>
                                    &lt;
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    {pagination.current}
                                </span>
                                <button
                                    onClick={() => pagination.onChange(pagination.current + 1)}
                                    disabled={pagination.current * pagination.pageSize >= pagination.total}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <span className="sr-only">下一页</span>
                                    &gt;
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
