'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/project/${id}`);
                const json = await res.json();
                if (json.code === 200) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">正在解析立项底层资产与合同链条...</p>
        </div>
    );

    if (!data) return <div className="p-20 text-center text-gray-400 font-bold">未找到该立项详情</div>;

    const totalContracted = data.contracts.reduce((sum: number, c: any) => sum + Number(c.totalAmount), 0);
    const conversionRate = Math.min((totalContracted / (data.budget || 1)) * 100, 100);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">{data.name}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                             {data.serialNo} <span className="mx-2">|</span> {data.type}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${
                        data.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                        立项状态: {data.status}
                    </span>
                    <Link 
                        href={`/contract/draft?projectId=${data.id}&customerId=${data.customer.id}`}
                        className="px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-widest"
                    >
                        基于本项目起草合同
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Summary Cards */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-32">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">立项产值预算</span>
                             <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-black text-indigo-600">¥ {data.budget.toLocaleString()}</span>
                             </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-32">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">已签合同总计</span>
                             <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-black text-emerald-600">¥ {totalContracted.toLocaleString()}</span>
                                <span className="text-xs font-bold text-gray-400 leading-none">合约转化率 {conversionRate.toFixed(1)}%</span>
                             </div>
                        </div>
                    </div>

                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">关联合同链条 (Linked Contracts)</h2>
                            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-400 rounded-full">{data.contracts.length} 份</span>
                        </div>

                        <div className="space-y-4">
                            {data.contracts.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 font-black uppercase text-[10px] tracking-widest">
                                    本项目暂未挂载任何子合同
                                </div>
                            ) : (
                                data.contracts.map((c: any) => (
                                    <div key={c.id} className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer" onClick={() => router.push(`/contract/detail/${c.id}`)}>
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 leading-none">{c.name}</span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase leading-none">{c.serialNo}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-sm font-black text-indigo-600 leading-none">¥ {c.totalAmount.toLocaleString()}</span>
                                            <span className={`mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                                c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Entity Info */}
                <div className="space-y-8">
                    <section className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white space-y-6">
                         <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 border-l-4 border-indigo-400 pl-3">立项报备主体</h2>
                         <div className="space-y-6">
                            <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">甲方单位</span>
                                <p className="text-sm font-black text-indigo-100">{data.customer.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">承办部门</span>
                                <p className="text-sm font-black text-gray-200">{data.deptName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">立项负责人 (PM)</span>
                                <p className="text-sm font-black text-gray-200">{data.pmName}</p>
                            </div>
                             <div className="pt-4 border-t border-gray-800">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2">项目备注</span>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    {data.remark || '暂无详细背景备注。'}
                                </p>
                            </div>
                         </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
