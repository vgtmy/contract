'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const CATEGORIES = [
    '合同原稿',
    '盖章终版',
    '补充协议',
    '招投标相关文件',
    '图纸/技术附件',
    '其他资料'
];

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const ContractAttachmentList: React.FC<{ contractId: string }> = ({ contractId }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
    const [uploadRemark, setUploadRemark] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/biz/contract/${contractId}/file`);
            if (res.ok) {
                const json = await res.json();
                setFiles(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [contractId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (rawFile.size > 50 * 1024 * 1024) {
            setErrorMsg('系统保护：超出50MB上限。');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', rawFile);
        formData.append('category', selectedCategory);
        formData.append('remark', uploadRemark);

        try {
            const res = await fetch(`/api/biz/contract/${contractId}/file`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.code === 200) {
                fetchFiles(); // refresh
                setUploadRemark('');
            } else {
                setErrorMsg(data.message || '上传异常拦截');
            }
        } catch (err) {
            setErrorMsg('网络阻断，请重试');
        } finally {
            setUploading(false);
            // Reset input regardless of success or fail so same file can trigger change again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerSelect = () => {
        fileInputRef.current?.click();
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('警告：您在此物理销毁的不仅是指针，也含本地磁盘原件。\n确认不再需要该档案吗？')) return;
        try {
            const res = await fetch(`/api/biz/contract/file/${fileId}`, { method: 'DELETE' });
            if (res.ok) fetchFiles();
            else alert('档案保护，清除受阻');
        } catch (e) {
            alert('断网异常');
        }
    };

    // Group files by category purely for a clearer UX, or just a flat list. 
    // Given flat is simpler to scan, we do flat ordered by desc date.

    return (
        <div className="bg-white shadow sm:rounded-lg border border-gray-200 h-full flex flex-col">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">电子附件控制台</h3>
                    <p className="mt-1 text-sm text-gray-500">将纸质载体或技术扫描件电子化并永久封存至本地。</p>
                </div>
                {files.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        已留存 {files.length} 份指纹档
                    </span>
                )}
            </div>

            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-1/3">
                        <label className="block tracking-wide text-gray-500 text-xs font-bold mb-1">标签门类</label>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-2/3 flex gap-2 items-end">
                        <div className="w-full">
                            <label className="block tracking-wide text-gray-500 text-xs font-bold mb-1">卷宗简要描述 (选填)</label>
                            <input
                                type="text"
                                value={uploadRemark}
                                onChange={e => setUploadRemark(e.target.value)}
                                placeholder="如：盖章件已交张总签字..."
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={triggerSelect}
                            disabled={uploading}
                            className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 h-[38px] min-w-[120px]"
                        >
                            {uploading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    上传中...
                                </span>
                            ) : '浏览并导入...'}
                        </button>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        // restrict specific types if needed, but leaving open for now.
                        />
                    </div>
                </div>
                {errorMsg && <p className="mt-2 text-sm text-red-600 font-medium">{errorMsg}</p>}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {loading ? (
                    <div className="text-center text-sm text-gray-500 py-10">正检索存储仓块...</div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-16 h-full">
                        <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <p className="text-sm">尚无归档文书，此履约单元暂呈“空管”状态。</p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                        {files.map(f => (
                            <li key={f.id} className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-xs tracking-wider text-blue-600 font-semibold mb-1 uppercase">{f.category}</p>
                                        <p className="text-sm font-medium text-gray-900 truncate mb-1" title={f.name}>{f.name}</p>
                                        <p className="text-xs text-gray-500 mb-2">{formatBytes(f.fileSize)} · {new Date(f.createdAt).toLocaleDateString()}</p>
                                        {f.remark && <p className="text-xs text-gray-400 italic mb-2 border-l-2 border-gray-200 pl-2">摘要：{f.remark}</p>}
                                        <div className="mt-3 flex items-center gap-3">
                                            <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded">
                                                ↓ 下载副本
                                            </a>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-xs text-gray-500">上传源：{f.uploaderName}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="粉碎销毁">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
