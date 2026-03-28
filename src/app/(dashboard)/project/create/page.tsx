'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProjectCreatePage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        serialNo: `XM-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        type: '国土空间规划',
        budget: '0',
        customerId: '',
        startDate: '',
        endDate: '',
        remark: ''
    });

    // 获取客户列表
    useEffect(() => {
        fetch('/api/system/customers/list').then(res => res.json()).then(json => {
            if (json.code === 200) setCustomers(json.data);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/project/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.code === 200) {
                alert('项目立项成功！');
                router.push('/project/list');
            } else {
                alert('失败: ' + json.message);
            }
        } catch (err) {
            alert('服务器连接异常');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">业务立项报备</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Project Initiation & Registration Center</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info Card */}
                <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">立项基本信息</h2>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">项目名称 (工程全称)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="请输入完整的项目报备名称"
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">内部立项编号</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.serialNo}
                                    onChange={e => setFormData({...formData, serialNo: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-indigo-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">项目业务分类</label>
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-700 outline-none"
                                >
                                    <option>国土空间规划</option>
                                    <option>建规/市政方案</option>
                                    <option>专项咨询</option>
                                    <option>测绘地理信息</option>
                                    <option>园林景观设计</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">甲方单位 (Customer)</label>
                                <select 
                                    required
                                    value={formData.customerId}
                                    onChange={e => setFormData({...formData, customerId: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-700 outline-none"
                                >
                                    <option value="">请选择甲方单位...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial & Timeline */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">产值与周期计划</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">预估立项产值 (Budget)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                                <input 
                                    type="number" 
                                    value={formData.budget}
                                    onChange={e => setFormData({...formData, budget: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-emerald-600"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">计划开始</label>
                                <input 
                                    type="date" 
                                    value={formData.startDate}
                                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">计划结题</label>
                                <input 
                                    type="date" 
                                    value={formData.endDate}
                                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remarks */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest border-l-4 border-gray-400 pl-3">立项备注说明</h2>
                    <textarea 
                        rows={5}
                        value={formData.remark}
                        onChange={e => setFormData({...formData, remark: e.target.value})}
                        placeholder="请输入项目的特殊背景、备注或承办科室细节..."
                        className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium text-gray-600 text-sm"
                    />
                </div>

                <div className="md:col-span-2 flex items-center justify-end space-x-4 pt-4">
                    <button 
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                    >
                        取消返回
                    </button>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest text-xs disabled:bg-gray-400"
                    >
                        {loading ? '正在报备立项...' : '确认立项报备'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectCreatePage;
