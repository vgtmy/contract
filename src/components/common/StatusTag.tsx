import React from 'react';

type StatusType = 'success' | 'warning' | 'error' | 'default' | 'processing';

interface StatusTagProps {
    type: StatusType;
    text: string;
}

const typeMap = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const StatusTag: React.FC<StatusTagProps> = ({ type, text }) => {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeMap[type]}`}>
            {type === 'processing' && (
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {type === 'success' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />}
            {type === 'warning' && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5" />}
            {type === 'error' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />}
            {type === 'default' && <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5" />}
            {text}
        </span>
    );
};
