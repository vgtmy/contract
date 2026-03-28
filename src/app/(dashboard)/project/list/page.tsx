'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ProjectListPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [filters, setFilters] = useState({ query: '', status: '' });

    const fetchList = async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams(filters).toString();
            const res = await fetch(`/api/project/list?${qs}`);
            const json = await res.json();
            if (json.code === 200) setData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [filters.status]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchList();
    };

    // 统计概览
    const totalBudget = data.reduce((sum, item) => sum + Number(item.budget), 0);
    const totalContracted = data.reduce((sum, item) => sum + Number(item.contractedTotal), 0);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header & Metrics */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">立项报备台账</h1>
                    <p className="text-gray-500 mt-2 font-medium">业务全景视图：从项目立项到签约转化的全量追踪</p>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 min-w-48 text-white">
                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest block mb-1">立项总预算</span>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-black text-white px-1">¥ {totalBudget.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-w-40">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">已签合同额</span>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-black text-emerald-600">¥ {totalContracted.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
                    <input 
                        type="text" 
                        placeholder="搜索项目名称、编号、负责人..."
                        value={filters.query}
                        onChange={e => setFilters({...filters, query: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </form>

                <select 
                    value={filters.status}
                    onChange={e => setFilters({...filters, status: e.target.value})}
                    className="px-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">所有状态</option>
                    <option value="ACTIVE">执行中 (ACTIVE)</option>
                    <option value="PAUSED">暂停 (PAUSED)</option>
                    <option value="CLOSED">已结项 (CLOSED)</option>
                </select>

                <Link 
                    href="/project/create"
                    className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-black transition-all shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>正式立项报备</span>
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">项目基础信息</th>
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">甲方单位</th>
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">立项产值 / 已签合同</th>
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">状态 & 签约率</th>
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">立项负责人</th>
                             <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-gray-300 font-black uppercase tracking-widest">
                                    暂无符合条件的立项记录
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                                {item.serialNo} <span className="mx-1">/</span> {item.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-600 truncate max-w-[180px] block">{item.customer.name}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-gray-400">¥ {item.budget.toLocaleString()}</span>
                                            <span className="text-sm font-black text-emerald-600 mt-1">¥ {item.contractedTotal.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col items-center space-y-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                                                item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                                {item.status}
                                            </span>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500" 
                                                    style={{ width: `${Math.min((item.contractedTotal / (item.budget || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                {item.pmName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-600">{item.pmName}</span>
                                                <span className="text-[9px] font-medium text-gray-400">{item.deptName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            <Link 
                                                href={`/project/detail/${item.id}`}
                                                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all uppercase tracking-tighter"
                                            >
                                                查阅明细
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectListPage;
