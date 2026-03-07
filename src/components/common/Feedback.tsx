import React from 'react';

// ---------------------------
// 1. Loading 转圈组件
// ---------------------------
export const Loading: React.FC<{ text?: string, fullHeight?: boolean }> = ({
    text = '加载中...',
    fullHeight = false
}) => {
    return (
        <div className={`flex flex-col items-center justify-center ${fullHeight ? 'h-full min-h-[400px]' : 'py-12'}`}>
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500">{text}</span>
        </div>
    );
};

// ---------------------------
// 2. Empty 空状态组件
// ---------------------------
export const Empty: React.FC<{ message?: string }> = ({ message = '暂无数据' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium text-gray-500">{message}</p>
        </div>
    );
};

// ---------------------------
// 3. Error 错误提示组件
// ---------------------------
export const ErrorState: React.FC<{ message?: string, onRetry?: () => void }> = ({
    message = '加载数据出错',
    onRetry
}) => {
    return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex flex-col items-center justify-center py-8">
            <svg className="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 font-medium mb-3">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-xs text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                >
                    重试
                </button>
            )}
        </div>
    );
};
