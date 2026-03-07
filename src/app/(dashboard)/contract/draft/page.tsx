'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractDraftPage() {
    const router = useRouter();

    // ============ Form & State ============
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [customers, setCustomers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectData, setSelectedProjectData] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        customerId: '',
        projectId: '',
        name: '',
        type: '规划设计合同',
        totalAmount: '',
        taxRate: '6',
        signDate: '',
        startDate: '',
        endDate: '',
        remark: ''
    });

    // ============ Effects ============
    useEffect(() => {
        // 1. Fetch Customers
        fetch('/api/biz/customer?pageSize=100')
            .then(res => res.json())
            .then(json => {
                if (json.data && json.data.list) setCustomers(json.data.list);
            }).catch(console.error);
    }, []);

    // 2. Fetch Projects when Customer changes
    useEffect(() => {
        if (formData.customerId) {
            fetch(`/api/biz/project?customerId=${formData.customerId}&pageSize=100`)
                .then(res => res.json())
                .then(json => {
                    if (json.data && json.data.list) {
                        setProjects(json.data.list);
                    }
                }).catch(console.error);

            // Reset project selection safely
            setFormData(f => ({ ...f, projectId: '' }));
            setSelectedProjectData(null);
        } else {
            setProjects([]);
            setSelectedProjectData(null);
        }
    }, [formData.customerId]);

    // 3. Load Project details when Project changes
    useEffect(() => {
        if (formData.projectId) {
            const proj = projects.find(p => p.id === formData.projectId);
            if (proj) {
                fetch(`/api/biz/project/${proj.id}`)
                    .then(res => res.json())
                    .then(json => {
                        if (json.data) setSelectedProjectData(json.data);
                    });
            }
        } else {
            setSelectedProjectData(null);
        }
    }, [formData.projectId, projects]);

    // ============ Handlers ============
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.customerId || !formData.projectId) {
            setErrorMsg('请选择明确的客户与立项基石！');
            return;
        }
        if (!formData.name) {
            setErrorMsg('必须为这份合同起个名字。');
            return;
        }
        if (!formData.totalAmount || isNaN(Number(formData.totalAmount)) || Number(formData.totalAmount) < 0) {
            setErrorMsg('请合规填写合同总额(阿拉伯数字)。');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/biz/contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'DRAFT' // Enforce start as Draft
                })
            });
            const data = await res.json();

            if (res.ok && data.code === 200) {
                // Success route
                router.push('/contract/ledger');
                router.refresh();
            } else {
                setErrorMsg(data.message || '系统录入拦截异常。');
            }
        } catch (err) {
            setErrorMsg('网络阻断，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8 border-b border-gray-200 pb-5">
                <h3 className="text-2xl font-bold leading-6 text-gray-900">拟定/起草新合同</h3>
                <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    本向导将带您串联甲乙双方缔约的基石。第一步：选择承载该条线的业务背景（客户指派给我们的某项大工程）；第二步：详化这份契约的条款摘要。
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">

                {/* ========= STEP 1 ========= */}
                <div className="space-y-6 sm:space-y-5">
                    <div>
                        <h4 className="text-lg font-medium text-gray-900 border-l-4 border-indigo-500 pl-2">
                            第一步：选定立项基准 (链路挂靠)
                        </h4>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start border-t border-gray-100 pt-5">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">选择甲方(客户)*</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                            <select
                                value={formData.customerId}
                                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3"
                            >
                                <option value="">-- 先定下买家 --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start pt-2">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">选取内部挂靠工程*</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                            <select
                                disabled={!formData.customerId}
                                value={formData.projectId}
                                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="">{formData.customerId ? '-- 选取该客户在我方开展的大项目 --' : '-- 锁定客户后激活联动 --'}</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedProjectData && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-md shadow-sm sm:col-span-3 ml-0 sm:ml-48 max-w-lg">
                            <h5 className="text-xs font-bold text-indigo-800 mb-2">↓↓ 以下属性被严格继承且禁改（权限锁定）</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><span className="text-gray-400">承办方:</span> {selectedProjectData.deptName}</div>
                                <div><span className="text-gray-400">负责PM:</span> {selectedProjectData.pmName}</div>
                                <div><span className="text-gray-400">母体匡算:</span> ￥{Number(selectedProjectData.budget).toLocaleString()}</div>
                                <div><span className="text-gray-400">流转态:</span> {selectedProjectData.status}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========= STEP 2 ========= */}
                <div className="pt-8 space-y-6 sm:space-y-5 relative">
                    <div className="flex justify-between items-center relative">
                        <h4 className="text-lg font-medium text-gray-900 border-l-4 border-blue-500 pl-2">
                            第二步：拟定标的契约
                        </h4>
                        {!formData.projectId && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10"></div>
                        )}
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start pt-5">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">拟定合同名*</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                            <input type="text"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例：光明区地标建设深化设计协议"
                                disabled={!formData.projectId}
                                className="max-w-lg block w-full shadow-sm border-gray-300 rounded-md py-2 px-3 disabled:bg-gray-100" />
                        </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start pt-2">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">合同额及开票税率*</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2 flex space-x-4 max-w-lg">
                            <div className="flex-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">￥</span>
                                <input type="number"
                                    value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                    disabled={!formData.projectId} placeholder="合同总额"
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 disabled:bg-gray-100" />
                            </div>
                            <div className="w-32 flex rounded-md shadow-sm">
                                <input type="number"
                                    value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                                    disabled={!formData.projectId}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 disabled:bg-gray-100" />
                                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start pt-2">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">履约周期(签订日与起止日)</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2 max-w-lg grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-gray-500">签署日</label>
                                <input type="date" disabled={!formData.projectId} value={formData.signDate} onChange={e => setFormData({ ...formData, signDate: e.target.value })} className="block w-full border-gray-300 rounded-md text-sm py-1.5 px-2 disabled:bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">生效期</label>
                                <input type="date" disabled={!formData.projectId} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="block w-full border-gray-300 rounded-md text-sm py-1.5 px-2 disabled:bg-gray-100" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">到期(计划)</label>
                                <input type="date" disabled={!formData.projectId} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="block w-full border-gray-300 rounded-md text-sm py-1.5 px-2 disabled:bg-gray-100" />
                            </div>
                        </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start pt-2">
                        <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">附言及条款摘要</label>
                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                            <textarea
                                rows={3}
                                disabled={!formData.projectId}
                                value={formData.remark}
                                onChange={e => setFormData({ ...formData, remark: e.target.value })}
                                className="max-w-lg block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 disabled:bg-gray-100"
                                placeholder="合同特殊付款方式声明 或 风险提醒批注..." />
                        </div>
                    </div>

                    {!formData.projectId && (
                        <div className="absolute inset-0 z-20" /> // Lock overlay click catcher
                    )}
                </div>

                {/* ========= PLACEHOLDERS FOR FUTURE STEPS ========= */}
                <div className="pt-8">
                    <div className="bg-gray-50 p-4 border border-dashed border-gray-300 rounded flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Step 3 [预留卡槽]: 资金收付分期拆解（需等基础信息存盘后开启）</span>
                        <button type="button" disabled className="text-gray-400 bg-gray-200 px-3 py-1 rounded text-sm cursor-not-allowed">锁定</button>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="bg-gray-50 p-4 border border-dashed border-gray-300 rounded flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Step 4 [预留卡槽]: 原件扫描件/正文草夹心归档</span>
                        <button type="button" disabled className="text-gray-400 bg-gray-200 px-3 py-1 rounded text-sm cursor-not-allowed">锁定</button>
                    </div>
                </div>

                <div className="pt-5">
                    {errorMsg && <div className="mb-4 bg-red-50 text-red-600 p-3 text-sm rounded-md border border-red-100">{errorMsg}</div>}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            取消并返回
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.projectId}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                ${(!formData.projectId || loading) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
                        >
                            {loading ? '保存基座中...' : '提交合同主条目 (生成流水号)'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
