'use client';

import React, { useState, useRef } from 'react';

interface UploaderProps {
    accept?: string;
    maxSizeMB?: number;
    onUploadSuccess: (fileUrl: string, fileName: string) => void;
}

export const Uploader: React.FC<UploaderProps> = ({
    accept = '.pdf,.doc,.docx',
    maxSizeMB = 20,
    onUploadSuccess
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        setErrorMSG('');
        if (file.size > maxSizeMB * 1024 * 1024) {
            setErrorMSG(`文件大小不能超过 ${maxSizeMB}MB`);
            return;
        }

        setUploading(true);
        // TODO: In real implementation, FormData should be posted to /api/upload endpoint
        // Here we wrap a mock Promise to simulate upload latency
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Mock success url
            const fakeUrl = `/uploads/${Date.now()}_${file.name}`;
            onUploadSuccess(fakeUrl, file.name);
        } catch (e) {
            setErrorMSG('上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full">
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="space-y-1 text-center">
                    {uploading ? (
                        <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}

                    <div className="flex text-sm text-gray-600 justify-center">
                        <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            {uploading ? '正在上传中...' : '点击上传'}
                        </span>
                        {!uploading && <p className="pl-1">或拖拽文件到这里</p>}
                    </div>
                    <p className="text-xs text-gray-500">
                        支持 {accept} 格式，小于 {maxSizeMB}MB
                    </p>
                </div>
            </div>

            {errorMSG && <p className="mt-2 text-sm text-red-600">{errorMSG}</p>}

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept={accept}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                        e.target.value = ''; // Reset
                    }
                }}
            />
        </div>
    );
};
