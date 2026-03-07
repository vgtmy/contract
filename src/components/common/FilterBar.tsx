'use client';

import React from 'react';

interface FilterBarProps {
    children: React.ReactNode;
    onSearch: () => void;
    onReset: () => void;
    loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    children,
    onSearch,
    onReset,
    loading = false,
}) => {
    return (
        <div className="bg-white p-4 mb-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-end gap-4">
                {/* Filter Inputs Slot */}
                <div className="flex-1 flex flex-wrap gap-4 items-center min-w-[300px]">
                    {children}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 ml-auto">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        重置
                    </button>
                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                        查询
                    </button>
                </div>
            </div>
        </div>
    );
};

// 预设的筛选包裹器小组件，保持间距统一
export const FilterItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
        <div className="w-48 sm:w-56">{children}</div>
    </div>
);
